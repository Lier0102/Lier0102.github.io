---
title: "[REV] 리버싱 공부 2일차"
date: 2026-03-16 10:52:00
categories: Essay
tags: [study]
---

마저 공부하던 부분 정리하고,  
쉬운 문제를 풀어봤습니다.  

```c
int main(void)

{
  puts("Hello, reverse engineer!");
  sleep(1);
  puts("Can you pass through me? :p");
  sleep(1);
  Obstacle();
  Win();
  return 0;
}
```
저번에 보던 코드.  
근데 `Obstacle()`에 `exit()` 박혀있음ㄷㄷ;  
그냥 저 함수 호출 부분을 없애면 됨.  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/8436c3b73d5e798a9971e8e61ade626ecc5cb6a1beae024b7fae088263af81c9.png)

생각보다 재밌는듯. 쉬우니까... ㅋㅋ  

실행 자체는 머신에서 따로 해봤다.  
패치 문제 중에 어려운 걸 풀어봐야 좀 해봤다고 말 할 수 있으려나..  
근데 그런 건 `pwn`이랑 섞여 나오지 않나 생각이 든다.  
<!--more-->
# Captain-Hook  
이거 풀어보려고 한다.  
`UPX`라는 추억의 이름도 있기도 하고, `PE`잖냐.  
지금까지 리눅스 기준으로 이론 공부한다 이랬는데  
이게 얼마만이냐. 당연히 뭐 하루만에 쉽게 풀릴 거라 생각은 하지 않는다.  

아 근데 이 맥에 그걸 깔 만큼 여유가 없는데.  
윈도우 컴에서 푼 뒤 올리도록 하겠다.