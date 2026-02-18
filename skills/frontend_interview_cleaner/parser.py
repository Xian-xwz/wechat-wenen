"""
Markdown解析模块 - 解析 front-end-interview-handbook 的 Markdown 文件
"""
import re
import os
import logging
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)


class MarkdownQuestionParser:
    """Markdown问题解析器"""
    
    def __init__(self):
        # 定义正则表达式模式
        self.section_pattern = re.compile(r'\n##\s+(.+?)\n')
        self.references_pattern = re.compile(r'\n#### References\b', re.IGNORECASE)
        self.subsection_pattern = re.compile(r'\n###\s+(.+?)\n')
        self.code_block_pattern = re.compile(r'```.*?```', re.DOTALL)
        self.bullet_pattern = re.compile(r'^\s*[\-\*\+]\s+', re.MULTILINE)
        
        # 难度关键词
        self.difficulty_keywords = {
            "easy": ["what is", "define", "explain briefly", "basic", "simple"],
            "hard": ["how would you", "implement", "optimize", "compare and contrast", "design a system"]
        }
    
    def parse_file(self, filepath: str, category: str) -> List[Dict[str, Any]]:
        """
        解析Markdown文件，提取问题和答案
        
        Args:
            filepath: Markdown文件路径
            category: 问题分类
            
        Returns:
            问题列表，每个元素包含question, answer, category等字段
        """
        logger.info(f"开始解析文件: {filepath}")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 按二级标题分割
            sections = self.section_pattern.split(content)
            
            if len(sections) < 2:
                # 如果没有找到二级标题，尝试按三级标题分割
                logger.info(f"文件中未找到二级标题，尝试三级标题: {filepath}")
                sections = self.subsection_pattern.split(content)
                
                if len(sections) < 2:
                    logger.warning(f"文件中未找到任何标题: {filepath}")
                    return []
                
                # 标记为使用三级标题模式
                use_subsection_mode = True
            else:
                use_subsection_mode = False
            
            questions = []
            
            # 第一个元素是标题之前的内容，跳过
            for i in range(1, len(sections), 2):
                if i + 1 >= len(sections):
                    break
                    
                title = sections[i].strip()
                section_content = sections[i + 1]
                
                # 提取答案内容
                answer_content = self._extract_answer_content(section_content)
                
                # 清理答案内容
                cleaned_answer = self._clean_answer_content(answer_content)
                
                # 提取子问题（三级标题）
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
                            "is_subsection": True,
                            "difficulty": self._estimate_difficulty(sub_title, sub_answer)
                        })
                else:
                    questions.append({
                        "question": title,
                        "answer": cleaned_answer,
                        "category": category,
                        "source_file": filepath,
                        "section_title": title,
                        "is_subsection": False,
                        "difficulty": self._estimate_difficulty(title, cleaned_answer)
                    })
            
            logger.info(f"从 {filepath} 解析出 {len(questions)} 个问题")
            return questions
            
        except Exception as e:
            logger.error(f"解析文件失败 {filepath}: {e}")
            return []
    
    def _extract_answer_content(self, section_content: str) -> str:
        """
        提取答案内容，处理References和下一个标题
        
        Args:
            section_content: 章节内容
            
        Returns:
            清理后的答案内容
        """
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
        
        # 找到下一个三级标题（###）的位置
        next_subsection_match = re.search(r'\n###\s+', section_content)
        if next_subsection_match:
            # 截取到下一个三级标题之前
            section_content = section_content[:next_subsection_match.start()]
        
        return section_content.strip()
    
    def _clean_answer_content(self, content: str) -> str:
        """
        清理答案内容，移除不需要的格式
        
        Args:
            content: 原始内容
            
        Returns:
            清理后的内容
        """
        # 移除代码块标记但保留内容
        content = self.code_block_pattern.sub('', content)
        
        # 移除HTML标签
        content = re.sub(r'<[^>]+>', '', content)
        
        # 移除行内代码标记
        content = re.sub(r'`([^`]+)`', r'\1', content)
        
        # 移除链接格式但保留文本
        content = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', content)
        
        # 移除图片标记
        content = re.sub(r'!\[([^\]]*)\]\([^)]+\)', '', content)
        
        # 移除多余的空白行
        content = re.sub(r'\n\s*\n+', '\n\n', content)
        
        # 清理行首的空白字符
        lines = [line.strip() for line in content.split('\n')]
        content = '\n'.join(lines)
        
        return content.strip()
    
    def _extract_subsections(
        self, 
        content: str, 
        parent_title: str
    ) -> List[Tuple[str, str]]:
        """
        提取三级标题的子问题
        
        Args:
            content: 章节内容
            parent_title: 父标题
            
        Returns:
            子问题列表，每个元素为(标题, 答案)
        """
        subsections = []
        
        # 按三级标题分割
        parts = self.subsection_pattern.split(content)
        
        if len(parts) > 1:
            # 第一个元素是三级标题之前的内容（如果有）
            # 这里我们只处理子问题，主问题在外部处理
            
            # 处理三级标题部分
            for i in range(1, len(parts), 2):
                if i + 1 >= len(parts):
                    break
                    
                sub_title = parts[i].strip()
                sub_content = parts[i + 1]
                
                # 提取子内容（移除后续的标题）
                sub_content = self._extract_answer_content(sub_content)
                sub_content = self._clean_answer_content(sub_content)
                
                # 组合标题
                full_sub_title = f"{parent_title}: {sub_title}"
                subsections.append((full_sub_title, sub_content))
        
        return subsections
    
    def _estimate_difficulty(self, question: str, answer: str) -> str:
        """
        基于问题和答案内容估计难度
        
        Args:
            question: 问题文本
            answer: 答案文本
            
        Returns:
            难度级别: easy, medium, hard
        """
        question_lower = question.lower()
        answer_lower = answer.lower()
        
        # 检查是否包含难度关键词
        easy_keywords = ["what is", "define", "explain briefly", "basic", "simple", "difference between"]
        hard_keywords = ["how would you", "implement", "optimize", "compare and contrast", 
                        "design a system", "explain in detail", "advantages and disadvantages"]
        
        # 计算关键词出现次数
        easy_count = sum(1 for kw in easy_keywords if kw in question_lower)
        hard_count = sum(1 for kw in hard_keywords if kw in question_lower)
        
        # 基于答案长度
        answer_length = len(answer)
        answer_lines = answer.count('\n') + 1
        
        # 评估逻辑
        if easy_count > 0 and answer_length < 300 and answer_lines < 5:
            return "easy"
        elif hard_count > 0 or answer_length > 500 or answer_lines > 10:
            return "hard"
        else:
            return "medium"
    
    def extract_metadata(self, filepath: str) -> Dict[str, Any]:
        """
        提取文件的元数据
        
        Args:
            filepath: 文件路径
            
        Returns:
            元数据字典
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 提取文件基本信息
            lines = content.split('\n')
            first_section = lines[0] if lines else ""
            
            metadata = {
                "filename": os.path.basename(filepath),
                "file_size": os.path.getsize(filepath),
                "line_count": len(lines),
                "first_section": first_section[:100],
                "sections_count": len(self.section_pattern.findall(content))
            }
            
            return metadata
            
        except Exception as e:
            logger.error(f"提取元数据失败 {filepath}: {e}")
            return {}


def parse_markdown_file(filepath: str, category: str) -> List[Dict[str, Any]]:
    """
    解析Markdown文件的便捷函数
    
    Args:
        filepath: 文件路径
        category: 分类
        
    Returns:
        问题列表
    """
    parser = MarkdownQuestionParser()
    return parser.parse_file(filepath, category)