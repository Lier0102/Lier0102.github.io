---
title: "[WEB] 공부한 지 2일차"
date: 2026-03-07 23:00:00
categories: Essay
tags: [study]
---

어제 확장 설치를 예고했으나 깜빡하고 그냥 자버렸다.  
게다가 롸업도 어제 마저 작성하려다 막힌 게 있었지만 해결하지 못하고 잠에 들었다.  
아무래도 오늘 12시 30분에 밖에 나가는 일이 생겨서 그런 것도 있다.  
어제 해결하지 못했던 웹 쪽부터 풀어보겠다.  
아, 드림핵 ctf 참가한 거 까먹음.  
근데 짜피 지금은 딱히 중요한 게 아니니까.. 넘어갈게요
<!--more-->

- SQL injection 3
- ...
- ...

# SQLI 3
아래 풀이는 롸업을 바탕으로 작성되었다.  
웹을 시작한 지 얼마 되지 않았기 때문에 벌써부터 이런 얘기를 하는 건 그래도..  
나는 웹 쪽에 재능이 없는 것 같다. 당연해서 좀 기분이 상한다..  
`Rana Khalil` 님의 풀이를 참고했다.  

아, 전에 테이블명을 정확히 적지 않았다.  
문제 설명에서 제공된 유저 테이블은  
`users`이다.  

백엔드에서 어떤 처리가 이루어지는가?  
그것을 확인해보기 위해 상품 상세 보기를 선택하면 된다.  
![Screenshot 2026-03-07 at 7.22.31 PM.png](https://dreamhack-media.s3.amazonaws.com/attachments/a2e34c7bec51b7864130e9e5403873f050b96d88c7dbc0e929fc3a91e0bf2eae.png)

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/f5e892fbbdd6d247b2b15a2c4fc48c9121b9ea73d80bd12819acab22e4a4d677.png)

`productId`라는 컬럼이 존재하는 걸 확인했다.  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/38932ae754058269bc70ef0bbd2e4fd097a04c1cd1692bd6d33ff99d1b7ce27a.png)
음.. 이미지가 가로로 길다 보니 그냥 봐선 잘 보이지 않는다.  
`burp suite`로 온 http history를 찍은 거라 그다지 중요하진 않다..  

어쨌든 저 요청을 `repeater`로 보낼 것이다.  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/a65de87f82d3447236fe4281f6db983ad9f5e73acdc70f64e2c8d61cd6291192.png)

해당 상세 보기 페이지에서 아래로 내리다 보면 위 버튼이 보이게 된다.  
`Checks stock`을 설정할 클릭하면  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/b2419dee96e9d03122d4835e22163c405308c51a1ca32562bc2e26d516def516.png)

`POST` 요청이 가게 된다.  
이것도 `Repeater`로 보낸다.  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/bdecd595806d3ff27b8cd4394851e0d18cdf32556aab5eca22c1f63415438e64.png)
요청이 `XML`로 이루어져 있기에 이쪽에 취약점이 있다고 판단되었다.  
물론 이것만으로 확정지을 순 없다. 나중에 내가 공부해서 더 알게 될지도.  
아마 `select` 구문에 사용되는 녀석이 이미 확인한  
`productId`, 그리고 지금 보이는 `storeId`인 것 같다.  

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/239fa051e1cc625dad711ceb0bb64993a292589b40fb8e004ccd9e8699c8d34f.png)
지금 위에 보이는 사진이 바로 컬럼 수를 확인하려 보낸 페이로드에 대한 응답, 그리고 보낸 요청이다.  
실패다. 

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/c50ce1d1b3471cff405085bfbce034df4db9bb96613a95d26ac54610cd2e022d.png)
`hackvertor` 확장을 사용하여 `hex-entites`로 인코딩한 뒤 보내봤다.  
잘 작동한다. 일단 `WAF`가 탐지하지 못했다.  
지금 보이는 `units` 앞에 붙은 숫자가 아마  
`productId`(현재 값)에 대한 모든 가능한 `unit`의 합계를 출력해주는 것 같다.  
이 글을 적는 시점이 상당히 차이가 나서, 앞 이미지와 뒷 이미지의 결과가 달라 혼동될 수 있다.  
그러나, 각 다른 상품에 들어가 확인한 정보니 유념치 않아도 된다.  
이말은 523 units 였다가 720 units로 바뀌었다는 것은  
쿼리에 의한 변화가 아님을 의미한다.  
저 쿼리는 컬럼의 개수를 확인하기 위해 사용했기 때문이다.  

말을 장황하게 붙여서 짧게 요약하겠다.  
523 units일 때 해당 쿼리를 사용해도 결과는 523 units로 표시된다,  
만약 컬럼이 1개라면. 2개라면 `UNION SELECT NULL, NULL`을 해도 결과가 523 units일 것이다.

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/0d924607ba6e74808a354e6f656b05d6d8a314ec0b99c6b4f19c45bc4f930e38.png)

뭐 실제로 컬럼이 1개만 존재한다는 것이 확인되었다. 

문자열 이어붙이기 연산을 사용한다고 하길래 썼다.  
`UNION SELECT username || '-' || password from users`  
그런데 이렇게 적는 건 하수들이 하는 짓이지. 왜 그런지 알아봤다.
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/50cecc96e7f83f1bb1dd2573186f8508e2390b306bceb816474a7d9d35e790fe.png)

`sql concatenation operators` 라는 검색어로 구글링 시,  

>SQL 문자열 연결(Concatenation)은 || 연산자, + 연산자 또는 CONCAT() 함수를 사용하여 둘 이상의 문자열이나 컬럼 값을 하나로 합칩니다. Oracle, PostgreSQL은 ||를, SQL Server는 +를 주로 사용하며, CONCAT()은 대부분의 DBMS에서 지원하지만 ||는 ANSI 표준입니다. 

...라는 gemini의 응답을 받을 수 있다.  
딱히 더 들어갈 필요는 없다, 문자열 연결 연산자 라는 것을 이해했으니까.  

롸이트업에 마지막에는, 주로 `python`을 이용해서 스크립팅을 활용한 익스플로잇을 웹에서도 애용한다고 설명한다.  
즉, 그나마 내 초라한 파이썬 실력이 쓸모 있어질 때가 왔다는 것이다.  

이번 문제에서 배운 점은,  
컬럼의 수, 컬럼의 이름, 쿼리의 구조, 그리고 데이터 베이스...의 종류?  
맞나.. 아무튼 이걸 쉬운 문제들에서는 빠르게 파악해야 의미가 있다는 것 같다. 

문제들을 보면서 그런 걸 느꼈다고나 할까.. 스승이 있으면 좋겠다고 생각한다.  
그런데 그런 일은 없을 걸 알기에, 앞으로는 오늘처럼 시간 잘못 써서 계획한 일을  
그르쳐서는 되지 않겠다, 라고 반성하고 있다.

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/0c6091e5495739d89ac86395c6e88e0924d66a3da5e48d883941db750d862691.png)

---

번외로..  
문제를 풀고 나서 `Cyberchef`가 있다는 걸 깜빡했다는 사실을 알았다.  
여기서 `HTML entity`로 바꾼 뒤  
`union select password from users where username = 'administrator'`  
이제서야 깨닫는 거지만 #x가 붙어있으니 `hex enitity`라는 점을 알 수 있었다..  
라는 게 놀랍다. 이런 생각을 문제를 보며 딱 한 번 했는데..   
정확히 어떻게 뭘 해야하는가, 그런 감이 없었다.  

비록 오늘 제대로 하진 않았지만 얻을 수 있었던 게 조금이나마 있어 다행인 것 같다.  

내일은 포너블/리버싱을 다룰 예정이다.  
1일차라던가.. 그런 건 아니라.. 뭐 쓸 양식이 딱히 없기도 하니  

이 글과 비슷한 양식으로 작성될 것으로 예상한다.  

긴 글 읽어주셔서 감사합니다