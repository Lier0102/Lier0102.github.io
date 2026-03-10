---
title: "[REV] 리버싱 공부 1일차"
date: 2026-03-09 22:30:00
categories: Essay
tags: [study]
---

이번엔 **기드라**로 바이너리 패치 연습을 해보고자 한다.  
전에는 `BINARY FIX TOOL` 문제를 풀었다.  
`wyv3rn` 님의 문제가 재밌던 덕분에 흥미롭게 바이너리 패치에 입문했지만, 지금 보니 제대로 공부하지 않았던 것 같다.  

# 동적 분석
```bash
$ ./sbo
Enter your name: bankai

Hello! bankai
```
그냥 입력하면 그대로 출력해주는 것 같다.   
퍼저도 딱히 써본 적 없고, 이번 공부가 끝나면 써보려고 한다.  
가능하면 만들어 볼까..  
<!--more-->

# 정적 분석
아니 잠깐...
```c
int main(void)

{
  char input [64];
  
  printf("Enter your name: ");
  fflush(stdout);
  read(0,input,0x400);
  printf("\nHello! %s",input);
  return 0;
}
```

이거 포너블 기초 문제 아님???  
아. 패치하는 거였음???  
일단 `read()`로 읽는 크기부터 수정하는 게 좋다고 배움  

`nm`으로 읽으니까 `get_shell`도 보이는구만.  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/1e40baa1b01c3b82a03d8c869873393f11b0ad7b0e38a5b55c62327ea395b00d.png)
일단 `edx`에 `0x400` 있던 거 `0x3f(63)`으로 수정해줬다. 이거면 끝 아님??  

`ELF`로 `export`하는 선택지가 없어서 `Original file`로 보냄.  

오늘은 기능 수업 3시간 정도 듣다가 와서 내일 마저 올릴게요