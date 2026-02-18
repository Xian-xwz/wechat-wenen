"""
选择题生成模块 - 集成Markdown解析、大模型调用和数据转换
"""
import asyncio
import json
import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import time

from .config import get_config, init_config
from .llm_client import LLMRequest, process_batch, get_error_logger
from .prompt_engineer import get_output_validator
from .transformer import transform_llm_output_to_quiz_format, generate_question_id
from .parser import MarkdownQuestionParser
from .utils import sanitize_markdown, save_json, load_json, Timer

logger = logging.getLogger(__name__)


class MarkdownParser:
    """Markdown解析器"""
    
    def __init__(self):
        self.section_pattern = re.compile(r'\n##\s+(.+?)\n')
        self.references_pattern = re.compile(r'\n#### References\b', re.IGNORECASE)
        self.code_block_pattern = re.compile(r'```.*?```', re.DOTALL)
        self.subsection_pattern = re.compile(r'\n###\s+(.+?)\n')
    
    def parse_file(self, filepath: str, category: str) -> List[Dict[str, Any]]:
        """
        解析Markdown文件，提取问题和答案
        
        Args:
            filepath: Markdown文件路径
            category: 分类（如JavaScript）
            
        Returns:
            问题列表，每个元素包含question, answer, category等字段
        """
        logger.info(f"解析Markdown文件: {filepath}")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 按二级标题分割
            sections = self.section_pattern.split(content)
            
            # 第一个元素是标题之前的内容，跳过
            questions = []
            
            for i in range(1, len(sections), 2):
                if i + 1 >= len(sections):
                    break
                    
                title = sections[i].strip()
                section_content = sections[i + 1]
                
                # 提取答案内容（直到References或下一个二级标题）
                answer_content = self._extract_answer_content(section_content)
                
                # 清理答案内容
                cleaned_answer = self._clean_answer_content(answer_content)
                
                # 如果有三级标题，可能需要进一步分割
                subsections = self._extract_subsections(cleaned_answer, title)
                
                if subsections:
                    # 如果有子问题，分别处理
                    for sub_title, sub_answer in subsections:
                        questions.append({
                            "question": sub_title,
                            "answer": sub_answer,
                            "category": category,
                            "source_file": filepath,
                            "section_title": title,
                            "is_subsection": True
                        })
                else:
                    questions.append({
                        "question": title,
                        "answer": cleaned_answer,
                        "category": category,
                        "source_file": filepath,
                        "section_title": title,
                        "is_subsection": False
                    })
            
            logger.info(f"从 {filepath} 解析出 {len(questions)} 个问题")
            return questions
            
        except Exception as e:
            logger.error(f"解析文件失败 {filepath}: {e}")
            return []
    
    def _extract_answer_content(self, section_content: str) -> str:
        """提取答案内容"""
        # 找到References部分（如果有）
        references_match = self.references_pattern.search(section_content)
        if references_match:
            # 截取到References之前
            section_content = section_content[:references_match.start()]
        
        # 找到下一个二级标题（##）的位置
        next_section_match = re.search(r'\n##\s+', section_content)
        if next_section_match:
            # 截取到下一个二级标题之前
            section_content = section_content[:next_section_match.start()]
        
        return section_content.strip()
    
    def _clean_answer_content(self, content: str) -> str:
        """清理答案内容"""
        # 移除代码块标记但保留内容
        content = self.code_block_pattern.sub('', content)
        
        # 移除多余的空白行
        content = re.sub(r'\n\s*\n', '\n\n', content)
        
        # 移除行首的空白字符
        lines = [line.strip() for line in content.split('\n')]
        content = '\n'.join(lines)
        
        return content.strip()
    
    def _extract_subsections(self, content: str, parent_title: str) -> List[Tuple[str, str]]:
        """提取三级标题的子问题"""
        subsections = []
        
        # 按三级标题分割
        parts = self.subsection_pattern.split(content)
        
        if len(parts) > 1:
            # 第一个元素是三级标题之前的内容（如果有）
            if parts[0].strip():
                # 将第一个部分作为主问题的答案
                pass
            
            # 处理三级标题部分
            for i in range(1, len(parts), 2):
                if i + 1 >= len(parts):
                    break
                    
                sub_title = parts[i].strip()
                sub_content = parts[i + 1]
                
                # 清理子内容（移除后续的三级标题）
                sub_content = self._extract_answer_content(sub_content)
                sub_content = self._clean_answer_content(sub_content)
                
                # 组合子标题
                full_sub_title = f"{parent_title}: {sub_title}"
                subsections.append((full_sub_title, sub_content))
        
        return subsections


class QuestionGenerator:
    """问题生成器"""
    
    def __init__(self):
        self.config = get_config()
        self.parser = MarkdownQuestionParser()
        self.error_logger = get_error_logger()
        self.validator = get_output_validator()
        
        # 缓存目录
        self.cache_dir = Path(self.config.processing.cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
    
    def load_source_files(self, category: str = "javascript") -> List[Dict[str, Any]]:
        """
        加载源文件并解析问题
        
        Args:
            category: 分类（javascript/html/css）
            
        Returns:
            解析出的问题列表
        """
        source_dir = Path(self.config.output.source_md_dir)
        source_dir.mkdir(exist_ok=True)
        
        # 确定文件名
        filename_map = {
            "javascript": "javascript-questions.md",
            "html": "html-questions.md",
            "css": "css-questions.md"
        }
        
        filename = filename_map.get(category.lower())
        if not filename:
            logger.error(f"不支持的分类: {category}")
            return []
        
        filepath = source_dir / filename
        
        if not filepath.exists():
            logger.warning(f"源文件不存在: {filepath}")
            logger.info(f"请先运行 download.py 下载源文件")
            return []
        
        # 解析文件
        questions = self.parser.parse_file(str(filepath), category)
        
        # 过滤无效问题
        valid_questions = []
        for q in questions:
            if q["question"] and q["answer"]:
                # 清理问题文本
                q["question"] = sanitize_markdown(q["question"])
                q["answer"] = sanitize_markdown(q["answer"])
                valid_questions.append(q)
        
        logger.info(f"加载 {category} 问题: {len(valid_questions)} 个有效问题")
        return valid_questions
    
    def get_cache_key(self, questions: List[Dict[str, Any]], category: str) -> str:
        """生成缓存键"""
        import hashlib
        
        # 基于问题内容和分类生成哈希
        content = f"{category}:{len(questions)}:"
        for q in questions[:10]:  # 只取前10个问题用于哈希
            content += f"{q.get('question', '')[:50]}:{len(q.get('answer', ''))}:"
        
        return hashlib.md5(content.encode('utf-8')).hexdigest()[:16]
    
    def load_from_cache(self, cache_key: str) -> Optional[List[Dict[str, Any]]]:
        """
        从缓存加载生成结果
        
        Args:
            cache_key: 缓存键
            
        Returns:
            缓存的结果或None
        """
        if not self.config.processing.cache_enabled:
            return None
        
        cache_file = self.cache_dir / f"{cache_key}.json"
        
        if cache_file.exists():
            try:
                data = load_json(cache_file)
                if data and "results" in data:
                    logger.info(f"从缓存加载: {cache_file} ({len(data['results'])} 个结果)")
                    return data["results"]
            except Exception as e:
                logger.error(f"加载缓存失败 {cache_file}: {e}")
        
        return None
    
    def save_to_cache(self, cache_key: str, results: List[Dict[str, Any]]):
        """
        保存生成结果到缓存
        
        Args:
            cache_key: 缓存键
            results: 生成结果
        """
        if not self.config.processing.cache_enabled:
            return
        
        cache_file = self.cache_dir / f"{cache_key}.json"
        
        cache_data = {
            "cache_key": cache_key,
            "timestamp": time.time(),
            "results_count": len(results),
            "results": results
        }
        
        if save_json(cache_data, cache_file):
            logger.info(f"保存到缓存: {cache_file}")
    
    async def generate_for_category(
        self,
        category: str,
        max_questions: Optional[int] = None,
        start_index: int = 0
    ) -> Dict[str, Any]:
        """
        为指定分类生成选择题
        
        Args:
            category: 分类（javascript/html/css）
            max_questions: 最大生成数量（None表示全部）
            start_index: 起始索引
            
        Returns:
            生成结果统计
        """
        logger.info(f"开始生成 {category} 选择题")
        
        # 加载问题
        questions = self.load_source_files(category)
        
        if not questions:
            return {
                "success": False,
                "error": f"没有找到 {category} 问题",
                "category": category,
                "generated": 0,
                "total": 0
            }
        
        # 限制问题数量
        if max_questions:
            questions = questions[start_index:start_index + max_questions]
        elif start_index > 0:
            questions = questions[start_index:]
        
        if not questions:
            return {
                "success": False,
                "error": f"指定范围没有 {category} 问题",
                "category": category,
                "generated": 0,
                "total": len(questions)
            }
        
        # 检查缓存
        cache_key = self.get_cache_key(questions, category)
        cached_results = self.load_from_cache(cache_key)
        
        if cached_results is not None:
            logger.info(f"使用缓存结果: {category} ({len(cached_results)} 个)")
            
            # 转换缓存结果为最终格式
            final_questions = []
            for i, result in enumerate(cached_results):
                if result.get("success"):
                    try:
                        final_question = transform_llm_output_to_quiz_format(
                            llm_output=result["data"],
                            original_question=questions[i]["question"],
                            original_answer=questions[i]["answer"],
                            category=category,
                            question_id=generate_question_id(questions[i]["question"], category)
                        )
                        final_questions.append(final_question)
                    except Exception as e:
                        logger.error(f"转换缓存结果失败 {i}: {e}")
            
            return {
                "success": True,
                "category": category,
                "generated": len(final_questions),
                "total": len(questions),
                "questions": final_questions,
                "from_cache": True
            }
        
        # 准备批量处理数据
        batch_data = []
        for q in questions:
            batch_data.append({
                "question": q["question"],
                "answer": q["answer"],
                "category": category
            })
        
        # 批量处理
        with Timer(f"生成 {category} 选择题") as timer:
            results = await process_batch(batch_data, category)
        
        # 处理结果
        final_questions = []
        failed_questions = []
        
        for i, result in enumerate(results):
            if result["success"]:
                try:
                    # 转换为最终格式
                    final_question = transform_llm_output_to_quiz_format(
                        llm_output=result["data"],
                        original_question=questions[i]["question"],
                        original_answer=questions[i]["answer"],
                        category=category,
                        question_id=generate_question_id(questions[i]["question"], category)
                    )
                    final_questions.append(final_question)
                    
                    # 质量检查
                    validation = self.validator.validate(result["data"])
                    if validation["warnings"]:
                        logger.warning(f"问题 {i} 有警告: {validation['warnings']}")
                        
                except Exception as e:
                    logger.error(f"转换结果失败 {i}: {e}")
                    failed_questions.append({
                        "index": i,
                        "question": questions[i]["question"],
                        "error": str(e)
                    })
            else:
                failed_questions.append({
                    "index": i,
                    "question": questions[i]["question"],
                    "error": result["error"]
                })
        
        # 保存缓存
        if final_questions:
            self.save_to_cache(cache_key, [
                r for r in results if r["success"]
            ])
        
        # 保存错误日志
        if failed_questions:
            for failed in failed_questions:
                self.error_logger.log_error(
                    request_data={
                        "question": failed["question"],
                        "category": category,
                        "index": failed["index"]
                    },
                    error_message=failed["error"]
                )
            self.error_logger.save()
        
        # 统计信息
        stats = {
            "success": len(final_questions) > 0,
            "category": category,
            "generated": len(final_questions),
            "failed": len(failed_questions),
            "total": len(questions),
            "success_rate": len(final_questions) / len(questions) * 100 if questions else 0,
            "time_elapsed": timer.elapsed(),
            "from_cache": False,
            "questions": final_questions,
            "failed_details": failed_questions
        }
        
        logger.info(
            f"生成完成: {category} - "
            f"成功 {stats['generated']}/{stats['total']} "
            f"({stats['success_rate']:.1f}%), "
            f"耗时 {stats['time_elapsed']:.1f}秒"
        )
        
        return stats
    
    async def generate_all(
        self,
        categories: List[str] = None,
        max_per_category: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        生成所有分类的选择题
        
        Args:
            categories: 分类列表，默认为["javascript", "html", "css"]
            max_per_category: 每个分类最大生成数量
            
        Returns:
            所有分类的生成结果
        """
        if categories is None:
            categories = ["javascript", "html", "css"]
        
        logger.info(f"开始生成所有分类的选择题: {categories}")
        
        all_results = {}
        all_questions = []
        
        for category in categories:
            result = await self.generate_for_category(
                category=category,
                max_questions=max_per_category
            )
            
            all_results[category] = result
            
            if result.get("success") and "questions" in result:
                all_questions.extend(result["questions"])
        
        # 总体统计
        total_generated = sum(r.get("generated", 0) for r in all_results.values())
        total_failed = sum(r.get("failed", 0) for r in all_results.values())
        total_questions = sum(r.get("total", 0) for r in all_results.values())
        
        overall_stats = {
            "success": total_generated > 0,
            "total_generated": total_generated,
            "total_failed": total_failed,
            "total_questions": total_questions,
            "overall_success_rate": total_generated / total_questions * 100 if total_questions else 0,
            "categories": all_results,
            "all_questions": all_questions,
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        logger.info(
            f"全部生成完成: "
            f"总计 {total_generated}/{total_questions} "
            f"({overall_stats['overall_success_rate']:.1f}%)"
        )
        
        return overall_stats


class QuestionExporter:
    """问题导出器"""
    
    def __init__(self):
        self.config = get_config()
    
    def export_to_json(
        self,
        questions: List[Dict[str, Any]],
        output_file: Optional[str] = None
    ) -> str:
        """
        导出为JSON文件
        
        Args:
            questions: 问题列表
            output_file: 输出文件路径（可选）
            
        Returns:
            输出文件路径
        """
        if output_file is None:
            output_dir = Path(self.config.output.output_dir)
            output_dir.mkdir(exist_ok=True)
            output_file = str(output_dir / self.config.output.json_filename)
        
        # 构建完整输出结构
        output_data = {
            "metadata": {
                "version": "1.0.0",
                "source": "front-end-interview-handbook",
                "total_questions": len(questions),
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "categories": list(set(q.get("category", "Unknown") for q in questions)),
                "format": "quiz"
            },
            "questions": questions
        }
        
        if save_json(output_data, output_file):
            logger.info(f"已导出 {len(questions)} 个问题到: {output_file}")
            return output_file
        else:
            logger.error(f"导出失败: {output_file}")
            return ""
    
    def export_mini_version(
        self,
        questions: List[Dict[str, Any]],
        count: int = 20
    ) -> str:
        """
        导出精简版（用于测试）
        
        Args:
            questions: 完整问题列表
            count: 导出数量
            
        Returns:
            输出文件路径
        """
        if not questions:
            logger.warning("没有可导出的问题")
            return ""
        
        # 取前N个问题
        mini_questions = questions[:min(count, len(questions))]
        
        output_dir = Path(self.config.output.output_dir)
        output_dir.mkdir(exist_ok=True)
        output_file = str(output_dir / self.config.output.mini_json_filename)
        
        output_data = {
            "metadata": {
                "version": "1.0.0",
                "source": "front-end-interview-handbook",
                "total_questions": len(mini_questions),
                "is_mini_version": True,
                "full_version_count": len(questions),
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            "questions": mini_questions
        }
        
        if save_json(output_data, output_file):
            logger.info(f"已导出精简版 {len(mini_questions)} 个问题到: {output_file}")
            return output_file
        else:
            logger.error(f"导出精简版失败: {output_file}")
            return ""
    
    def create_zip_package(self, json_file: str) -> Optional[str]:
        """
        创建ZIP压缩包
        
        Args:
            json_file: JSON文件路径
            
        Returns:
            ZIP文件路径或None
        """
        import zipfile
        from pathlib import Path
        
        json_path = Path(json_file)
        if not json_path.exists():
            logger.error(f"JSON文件不存在: {json_file}")
            return None
        
        output_dir = Path(self.config.output.output_dir)
        output_dir.mkdir(exist_ok=True)
        
        zip_filename = self.config.output.zip_filename
        zip_path = output_dir / zip_filename
        
        try:
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # 添加JSON文件
                zipf.write(json_path, json_path.name)
                
                # 添加README文件（如果存在）
                readme_path = Path("README.md")
                if readme_path.exists():
                    zipf.write(readme_path, "README.md")
                
                logger.info(f"已创建ZIP包: {zip_path}")
                return str(zip_path)
                
        except Exception as e:
            logger.error(f"创建ZIP包失败: {e}")
            return None


# 全局实例
_generator: Optional[QuestionGenerator] = None
_exporter: Optional[QuestionExporter] = None


def get_generator() -> QuestionGenerator:
    """获取全局生成器实例"""
    global _generator
    if _generator is None:
        _generator = QuestionGenerator()
    return _generator


def get_exporter() -> QuestionExporter:
    """获取全局导出器实例"""
    global _exporter
    if _exporter is None:
        _exporter = QuestionExporter()
    return _exporter


async def generate_questions(
    categories: List[str] = None,
    max_per_category: Optional[int] = None
) -> Dict[str, Any]:
    """
    生成问题的便捷函数
    
    Args:
        categories: 分类列表
        max_per_category: 每个分类最大数量
        
    Returns:
        生成结果
    """
    # 确保配置已初始化
    init_config()
    
    generator = get_generator()
    return await generator.generate_all(categories, max_per_category)


def export_questions(
    questions: List[Dict[str, Any]],
    create_mini: bool = True,
    create_zip: bool = True
) -> Dict[str, Any]:
    """
    导出问题的便捷函数
    
    Args:
        questions: 问题列表
        create_mini: 是否创建精简版
        create_zip: 是否创建ZIP包
        
    Returns:
        导出结果
    """
    exporter = get_exporter()
    
    results = {
        "full_version": "",
        "mini_version": "",
        "zip_file": ""
    }
    
    # 导出完整版
    full_file = exporter.export_to_json(questions)
    results["full_version"] = full_file
    
    # 导出精简版
    if create_mini and questions:
        mini_file = exporter.export_mini_version(questions)
        results["mini_version"] = mini_file
    
    # 创建ZIP包
    if create_zip and full_file:
        zip_file = exporter.create_zip_package(full_file)
        results["zip_file"] = zip_file
    
    return results