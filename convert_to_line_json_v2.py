#!/usr/bin/env python
"""
转换 frontend_questions.json 为每行一个 JSON 对象格式
用于微信云数据库导入
"""
import json
import os
import sys

def main():
    # 绝对路径配置
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(base_dir, "cleaned_data", "frontend_questions.json")
    output_dir = os.path.join(base_dir, "cleaned_data", "new_data")
    output_file = os.path.join(output_dir, "frontend_questions_line.json")
    
    print("=" * 50)
    print("开始转换 JSON 为每行一个对象格式")
    print(f"输入文件: {input_file}")
    print(f"输出目录: {output_dir}")
    print("=" * 50)
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 读取输入文件
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"错误: 找不到输入文件 {input_file}")
        return 1
    except Exception as e:
        print(f"读取文件时出错: {e}")
        return 1
    
    # 解析 JSON
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"JSON 解析错误: {e}")
        return 1
    
    # 提取 questions 数组
    if "questions" not in data:
        print("错误: 输入文件中缺少 'questions' 字段")
        return 1
    
    questions = data["questions"]
    total_count = len(questions)
    print(f"找到 {total_count} 个问题")
    
    # 写入每行一个 JSON 对象
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            for i, question in enumerate(questions, 1):
                # 转换为 JSON 字符串，确保中文字符不转义
                line = json.dumps(question, ensure_ascii=False)
                f.write(line + '\n')
                
                # 显示进度
                if i % 10 == 0 or i == total_count:
                    print(f"已处理: {i}/{total_count}")
        
        print(f"\n转换成功!")
        print(f"输出文件: {output_file}")
        print(f"总行数: {total_count}")
        
        # 显示前几行示例
        print("\n前3行示例:")
        with open(output_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for j, line in enumerate(lines[:3], 1):
                print(f"行{j}: {line.strip()}")
        
        return 0
        
    except Exception as e:
        print(f"写入输出文件时出错: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())