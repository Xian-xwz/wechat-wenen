"""
下载模块 - 下载 front-end-interview-handbook 的 Markdown 源文件
"""
import os
import requests
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path

from .config import get_config

logger = logging.getLogger(__name__)


class MarkdownDownloader:
    """Markdown文件下载器"""
    
    def __init__(self):
        self.config = get_config()
        self.base_url = "https://raw.githubusercontent.com/yangshun/front-end-interview-handbook/main/contents/"
        
        # 定义要下载的文件
        self.files = {
            "javascript": "javascript-questions.md",
            "html": "html-questions.md", 
            "css": "css-questions.md"
            # 可选文件
            # "algorithms": "algorithms.md",
            # "system-design": "front-end-system-design.md"
        }
    
    def download_file(self, filename: str, save_path: Path) -> bool:
        """
        下载单个文件
        
        Args:
            filename: 文件名
            save_path: 保存路径
            
        Returns:
            下载是否成功
        """
        url = self.base_url + filename
        
        try:
            logger.info(f"开始下载: {filename}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # 保存文件
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(save_path, 'w', encoding='utf-8') as f:
                f.write(response.text)
            
            file_size = os.path.getsize(save_path)
            logger.info(f"下载完成: {filename} ({file_size:,} 字节)")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"下载失败 {filename}: {e}")
            return False
    
    def download_all(self, categories: Optional[List[str]] = None) -> Dict[str, bool]:
        """
        下载所有文件
        
        Args:
            categories: 要下载的分类列表，默认为全部
            
        Returns:
            下载结果字典 {filename: success}
        """
        if categories is None:
            categories = list(self.files.keys())
        
        source_dir = Path(self.config.output.source_md_dir)
        source_dir.mkdir(parents=True, exist_ok=True)
        
        results = {}
        
        for category in categories:
            if category not in self.files:
                logger.warning(f"未知分类: {category}")
                continue
            
            filename = self.files[category]
            save_path = source_dir / filename
            
            # 检查文件是否已存在
            if save_path.exists():
                logger.info(f"文件已存在，跳过下载: {filename}")
                results[filename] = True
                continue
            
            success = self.download_file(filename, save_path)
            results[filename] = success
            
            # 添加延迟，避免请求过快
            import time
            time.sleep(1)
        
        # 统计结果
        successful = sum(1 for success in results.values() if success)
        total = len(results)
        
        logger.info(f"下载完成: 成功 {successful}/{total}")
        
        return results
    
    def check_local_files(self) -> Dict[str, bool]:
        """
        检查本地文件是否存在
        
        Returns:
            文件存在状态字典 {filename: exists}
        """
        source_dir = Path(self.config.output.source_md_dir)
        source_dir.mkdir(parents=True, exist_ok=True)
        
        status = {}
        
        for category, filename in self.files.items():
            filepath = source_dir / filename
            exists = filepath.exists()
            status[filename] = exists
            
            if exists:
                file_size = os.path.getsize(filepath)
                logger.info(f"文件存在: {filename} ({file_size:,} 字节)")
            else:
                logger.warning(f"文件不存在: {filename}")
        
        return status
    
    def get_file_path(self, category: str) -> Optional[Path]:
        """
        获取文件路径
        
        Args:
            category: 分类
            
        Returns:
            文件路径或None
        """
        if category not in self.files:
            logger.error(f"未知分类: {category}")
            return None
        
        filename = self.files[category]
        source_dir = Path(self.config.output.source_md_dir)
        filepath = source_dir / filename
        
        return filepath if filepath.exists() else None


def download_source_files(categories: Optional[List[str]] = None) -> bool:
    """
    下载源文件的便捷函数
    
    Args:
        categories: 要下载的分类列表
        
    Returns:
        下载是否成功（至少一个文件成功）
    """
    downloader = MarkdownDownloader()
    results = downloader.download_all(categories)
    
    return any(results.values())


def check_source_files() -> Dict[str, Any]:
    """
    检查源文件的便捷函数
    
    Returns:
        文件状态信息
    """
    downloader = MarkdownDownloader()
    status = downloader.check_local_files()
    
    existing_files = [f for f, exists in status.items() if exists]
    missing_files = [f for f, exists in status.items() if not exists]
    
    return {
        "total_files": len(status),
        "existing_files": existing_files,
        "missing_files": missing_files,
        "all_exist": len(missing_files) == 0
    }


if __name__ == "__main__":
    # 命令行入口
    import argparse
    
    parser = argparse.ArgumentParser(description="下载 front-end-interview-handbook 源文件")
    parser.add_argument("--categories", nargs="+", 
                       choices=["javascript", "html", "css"],
                       default=["javascript", "html", "css"],
                       help="要下载的分类")
    parser.add_argument("--check", action="store_true",
                       help="仅检查文件，不下载")
    
    args = parser.parse_args()
    
    if args.check:
        print("检查源文件状态:")
        status = check_source_files()
        print(f"总文件数: {status['total_files']}")
        print(f"已存在: {len(status['existing_files'])}")
        print(f"缺失: {len(status['missing_files'])}")
        
        if status['missing_files']:
            print(f"缺失文件: {', '.join(status['missing_files'])}")
    else:
        print(f"开始下载分类: {', '.join(args.categories)}")
        success = download_source_files(args.categories)
        
        if success:
            print("下载完成")
        else:
            print("下载失败")
            exit(1)