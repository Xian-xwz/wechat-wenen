# convert-docs Skill

将 PDF、DOCX、DOC 文档转换为 Markdown 格式的工具。

## 功能

- **PDF 转 Markdown**：使用 pdfplumber 提取文本和表格
- **DOCX 转 Markdown**：使用 python-docx 提取文本、标题和表格
- **DOC 转 Markdown**：通过 LibreOffice 或直接读取转换

## 安装依赖

```bash
pip install pdfplumber python-docx --index-url https://pypi.org/simple
```

## 使用方法

### 命令行

```bash
# 转换单个文件
python skills/convert-docs/index.py document.pdf

# 转换多个文件
python skills/convert-docs/index.py file1.docx file2.pdf file3.doc

# 指定输出目录
python skills/convert-docs/index.py document.docx -o ./output/
```

### Python 代码调用

```python
from skills.convert-docs.index import convert_pdf_to_md, convert_docx_to_md, convert_doc_to_md

# PDF 转换
convert_pdf_to_md('document.pdf', 'output.md')

# DOCX 转换
convert_docx_to_md('document.docx', 'output.md')

# DOC 转换
convert_doc_to_md('document.doc', 'output.md')
```

## 转换效果

- **标题识别**：自动识别标题层级（Heading 1/2/3）
- **表格转换**：将表格转换为 Markdown 表格格式
- **格式保留**：尽可能保留原文档的结构和格式

## 注意事项

1. DOC 文件转换建议使用 LibreOffice 以获得最佳效果
2. 复杂的格式（如图片、特殊排版）可能无法完全保留
3. 中文文档使用 UTF-8 编码输出
