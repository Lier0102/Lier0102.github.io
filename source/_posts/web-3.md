---
title: "[WEB] 공부한 지 3일차"
date: 2026-03-11 22:00:00
categories: Essay
tags: [study]
---

배운 내용은  

- **DB 조사**
- **UNION을 활용한 공격**

이렇게 세 가지이다.  
사실 3년전에 드림핵이 가르쳐 줬다.  
그런데 그땐 이해도 제대로 하지 못하고 쿼리 대충 만들어서 쓰던 거라  
이번 기회에 다시 복습하고 넘어가자고 생각했다.  
<!--more-->

# DB 조사
이것이 의미하는 바는 두 가지라고 한다.  

- 해당 `DB`의 **타입/버전** 알아내기
- 해당 `DB`가 담고 있는 **컬럼/테이블** 알아내기

먼저 전자부터 쉽게 정리하겠다.  
**오라클** 기준이다.  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/0db8ebb8031e2690103da591d59eccc9197c8b9fb7cafefa3d51c7067c3aba0a.png)

일단 카테고리부터 선택해보자, 앞서 나온 문제들과 비슷한 웹앱이라고 판단했다.  

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/2b42ee041db6a811bbced4a73f58f2d7bca11ddb3d00469d9787ad77fa39126a.png)

여기에 `'`를 하나 넣어보겠다.
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/301af88208546b5638097cb1b38cd9ec10455c267c673372ef853304102796bf.png)
앙기모띠.이것이나다.  

대충 **오라클**에선 `v$version`이 버전이라고 했으니 골라주도록 하지.  

`SELECT * FROM v$version
PostgreSQL	SELECT version()`

그런데, 지금은 이미 앞에 있는 `select` 뒤에 `select`를 써야 하니  
앞 쿼리에서 사용하던 컬럼과 수를 맞춰줘야 한다.  

따라서 페이로드는  
`' union select null, null from v$version --`
이다.  

`banner`를.. `banner`를 봐야한다!!!  
그래서 앞 컬럼만 `banner`로 바꿔놓고  

워후!!!
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/cdbab8cca5c82bfd1e85a608d3b582cac47255037485428b76d3ca03f636478d.png)

이번엔 **MySQL**, 그리고 **Microsoft**  
**SQLi**가 되는가에 대한 검증은 앞서 푼 문제처럼 진행했다.  

다만 이번 페이로드는 주석이 바뀌었다.  
`' union select @@version, null#`

`mysql`은 `from`절을 생략하는 게 가능하다...?  
신기하네.  

이번엔 **DB 버전**을 알았으니  
**내용**을 출력할 차례다.  

오라클이 예외라 오라클을 제외하고 먼저 설명한 뒤,  
오라클과 관련된 개념은 마지막에 풀면서 익히겠다.  

> This lab contains a SQL injection vulnerability in the product category filter. The results from the query are returned in the application's response so you can use a UNION attack to retrieve data from other tables.  

> The application has a login function, and the database contains a table that holds usernames and passwords. You need to determine the name of this table and the columns it contains, then retrieve the contents of the table to obtain the username and password of all users.  

> To solve the lab, log in as the administrator user.

이번 문제도 같은 취약점이 있다고 한다.  
그러므로 페이로드만 바꾸도록 하겠다.  

강의 내용에 따르면,  
다음 쿼리로?  
`SELECT * FROM information_schema.tables`  

```bash
TABLE_CATALOG  TABLE_SCHEMA  TABLE_NAME  TABLE_TYPE
=====================================================
MyDatabase     dbo           Products    BASE TABLE
MyDatabase     dbo           Users       BASE TABLE
MyDatabase     dbo           Feedback    BASE TABLE
```
이런 결과가 나온다고 한다.  
이런 결과가 뭐냐 한다면...!?  

해당 테이블의 전체 정보를 가져온다는 것이다!!!  
우리는 테이블의 이름을 모른다.  
따라서 테이블 모두를 확인할 수 있는 쿼리를 작성해야 한다.  

`' union select table_name, null from information_schema.tables--`

결과는,  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/afd5916037ffeda2831e96a522b45980d13e42e6b42aba4bbf8a29e4bd0b7054.png)
성공적이다!!  

여기에는 나오지 않지만 `burp suite`에 남겨진 기록을 보면 다음 테이블을 확인 가능했다:  

`users_jfckb`.  
그리고 이 테이블에 있는 컬럼을 다음 쿼리로 조회하고
`password_tizstj`를 찾은 뒤  

해당 컬럼을 찾아보면...

유저 테블에서 해당 컬럼을 조회하면?  
`' union select password_jwhzhf, null from users_txeyrw--`
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/2bd81d1015580baa8e77c4a32eb25700d748f2bc3da25a7bd929999ad376a543.png)

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/3787a26c8f91797117d646083e91aae30788ee32cc70cca9104380c2bf56682c.png)

이렇게 된다.  

비번 후보는 세 개이므로, 하나씩 `administrator`에 대입해본다.  
약간 sql을 직접하는 느낌이 오랜만이라 재밌다랄까.  

**오라클**도 비슷하다.   
단지 `information_schema.tables`가 `all_tables`로,  
`information_schema.columns`가 `all_tab_columns`로 바뀌었을 뿐이다.  

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/a5fbf586c0726f462d5f8652d7f92a730a235c4ef0d727d0611ca55f4b3700db.png)

두 문제 다 나름대로 풀었다. 재밌었다, 오랜만에 웹해킹 복습에서 재미를 느낄 줄은 몰랐다.

# UNION을 활용한 공격

컬럼 개수 맞추는 걸 또 연습하고 있다.  
강의는 3일차, union 강의까지 하고, 드림핵에서 워게임을 슬슬 다시 풀어봐야겠다.
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/baa261a8d0372164ce8cc634bff0c636c8d33849bd3f01aff2c3c9c5dbbe0381.png)

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/c649db7362428a29799415770e4fd0b1526937a14865c35b4fbf08c73062a013.png)

위 사진은 컬럼 수만 맞힌 사진이다.  
아래 사진은 `MySQL`이라는 점을 활용해 `from` 절을 생략하고 컬럼 수 예측,  
내가 원하는, 여기서는 `string`으로 가정하겠다.  
그런 데이터 타입을 가진 컬럼을 찾은 사진이다.  

이제 드림핵으로 넘어가려 한다, 쿼리를 만드는 방법은 간단하게 아니까