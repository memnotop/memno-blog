---
title: 基于Loongarch的双发射SoC设计：数据前递
description: 一句话摘要
publishDate: 2026-06-15 11:26:45
tags:
  - technical
  - loongarch
  - soc设计
repositories:
  - technical
heroImageSrc: ../../../../../public/img/covers/cpu.webp
heroImageAlt: 封面图说明
heroImageColor: "#659EB9"
showHeroImage: true
language: 中文
draft: false
---

<!-- 这里先写一句你想表达的核心观点。 -->

## 什么是数据前递

## 为什么要数据前递
举例
```
add.w  r1, r2, r3
add.w  r4, r1, r5
```
第二句需要读取 r 1，但是，在流水线中写回和译码阶段相差周期长，第二句无法读取到正确的数据，所以 r 1 的数据需要提前给到第二条指令。

不前递的话，大量代码都要停：
```
addi.w r 1, r 0, 1
addi.w r 2, r 11, 1
addi.w r 3, r 2, 1
```
这类连续依赖非常常见。没有前递，IPC 会很差。

