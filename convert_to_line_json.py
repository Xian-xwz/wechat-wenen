#!/usr/bin/env python
"""
将 frontend_questions.json 转换为每行一个 JSON 对象的格式
适用于微信云数据库导入

用法:
    python convert_to_line_json.py
"""

import json
import os
from pathlib import Path

def convert_to_line_json():
    """转换JSON为每行一个对象"""
    # 路径配置
    base_dir = Path(__file__).parent
    input_file = base_dir / "cleaned_data" / "frontend_questions.json"
    output_dir = base_dir / "cleaned_data" / "new_data"
    output_file = output_dir / "frontend_questions_line.json"
    
    # 确保输出目录存在
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"输入文件: {input_file}")
    print(f"输出目录: {output_dir}")
    print(f"输出文件: {output_file}")
    print("-" * 50)
    
    # 读取原始JSON文件
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"[错误] 输入文件不存在: {input_file}")
        return False
    except json.JSONDecodeError as e:
        print(f"[错误] JSON解析失败: {e}")
        return False
    
    # 提取questions数组
    if "questions" not in data:
        print("[错误] 输入文件中缺少 'questions' 字段")
        return False
    
    questions = data["questions"]
    total_questions = len(questions)
    print(f"找到 {total_questions} 个题目")
    
    # 写入每行一个JSON对象
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            for i, question in enumerate(questions, 1):
                # 将每个问题对象转换为JSON字符串
                line = json.dumps(question, ensure_ascii=False)
                f.write(line + '\n')
                
                # 显示进度
                if i % 10 == 0 or i == total_questions:
                    print(f"已处理: {i}/{total_questions}")
        
        print(f"\n[成功] 转换完成!")
        print(f"输出文件: {output_file}")
        print(f"总行数: {total_questions}")
        
        # 显示前几个示例
        print(f"\n前3行示例:")
        with open(output_file, 'r', encoding='utf-8') as f:
            for j, line in enumerate(f, 1):
                if j <= 3:
                    print(f"行{j}: {line.strip()}")
                else:
                    break
                    
        return True
        
    except Exception as e:
        print(f"[错误] 写入文件时发生异常: {e}")
        return False

if __name__ == "__main__":
    success = convert_to_line_json()
    exit_code = 0 if success else 1
    exit(exit_code)