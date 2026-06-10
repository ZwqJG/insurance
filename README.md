# 儿童重疾险智能方案生成器 MVP

## 项目介绍

面向保险代理人的儿童重疾险智能方案生成工具。
代理人填写客户基本信息，系统自动从 JSON 产品数据中匹配 2~3 款儿童重疾险产品，
生成产品对比方案，代理人可基础修改后通过浏览器打印导出 PDF。

## 项目结构

```
insurance-proposal-mvp/
  backend/          Node.js + Express + TypeScript 后端
  frontend/         React + TypeScript + Vite 前端
  README.md
```


## 导出 PDF

在方案预览页点击右上角「导出 PDF」按钮，
浏览器会弹出打印对话框，选择「另存为 PDF」即可。





详细部署配置参考产品说明书。
