---
title: "[WEB] 공부한 지 1일차"
date: 2026-03-06 22:00:00
categories: Essay
tags: [study]
---

드림핵도 좋다.  
그런데 난 뭐에 이끌렸는지 다른 강의를 찾았다.  

오늘 배우고 풀었던 내용을 정리하고자 한다.  
이제 일주일에 14개 이상의 글을 작성해야 한다..  
뭐, 그래야 사람 구실을 하니까?  
하루 백준 20문제 보단 확실히 유효한 것 같다.  


시작하겠다.  

오늘, 3월 6일 21시부터 22시 30분까지 배운 내용은 다음과 같다.
- SQL injection 기초 1
- *''* 2
- *''* 3

# SQL injection-1
`where` 절을 악용해서 의도되지 않은 데이터 추출을 간단하게 연습했다.  

해당 사이트는 평범한 쇼핑몰이다.

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/2ba7630c7d1ff87e069213300124635972408c8601fb2a4b950d60f599ea2bcb.png)

선택 가능한 메뉴에서 임의 카테고리를 선택하면 `URL`이 이렇게 바뀐다.
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/9932b008fb31c86daf346a85076458d450c4398bdb3a3cc825a1d6d8066ac505.png)

쿼리문 조작, 그리고 결과가 나오는 지 확인하려면  
`' or 1=1 --` 혹은 `' --`를 사용해보면 된다고 배웠다.  

따라서 나는 `' --`를 사용했다.  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/0364dd8fd0dc7ed44051826a81c88ab6f9cf79647dccc01256a5fd694d82bf6b.png)

결과는 이러하다.  
문제에서 따로 `released`라는 컬럼이 있다고 명시되어 있고, 이는 `0 혹은 1`의 값을 가진다는 설명이 있다.  

지금의 경우에는 출시되지 않은 상품이 보인다는 것을 확인할 수 있다.
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/7e0324aabd74db7c7a6f98bd7031b1fee4eaada6939c753429c3f4d8055f0c6e.png)

그러나, 이는 한 카테고리 내에서의 결과와 같다.  
 지금 가진 정보는 부족하다, 따라서 정보를 확보해야 하는 상황.  

이에 따라 `' or 1=1 --`을 사용하기로 했다.  
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/877807b55bf6696011b39dbd30189eda443aadb82a92f4afc5cee8255476bfa6.png)
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/f727c3b6b13a2e2c2c2ff4e9a746d79f1e3bea234a1e1407e004758ef778795f.png)

해결했다.

# SQL injection-2
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/f9904925f46abf65f92e687df82e0264de2b4046e50f2531bb605bb65b5f1461.png)
이번엔 문제 설명에서 관리자 계정으로 들어가라 지시했다.  
아직 `burp suite` 같은 도구는 사용하지 않겠다.  
드림핵에서 웹 문제를 풀고,   
`burp suite` 없으면 못 푸는 문제들도 풀었다.   
그러나 지금은 다시 기초를 빠르게 다져야 하므로  
내가 섣부르게 `AI`를 사용하여 쌓은 지식을 교체해야 한다.  

뭐... 문제 설명에서  
`SELECT * FROM users WHERE username = 'wiener' AND password = 'bluecheese'`  
이런 `sql 쿼리`를 사용하며 사용자의 입력이 변수로 활용되는 동시에 쿼리에 포함된다고 가정하라고 언급했다.  

내 나름대로 이해한 바로는 계정은 관리자, 뒤는 주석 처리로 처리하는 것이었다.  

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/1c3ce516364896ac09eac2da2e31f876b5aff09c6c699c904b221fe0df2b4aa0.png)
이게 되네, 나 재능 있는 걸지도  

# SQL injection-3
이번 공부의 마지막 문제다.  
`XML 인코딩`을 통한 `SQL injection 필터 우회`가 키워드다.  
구글에 검색하면 익숙한.. 원래는 없었지만 아무튼 축복이다. LLM 만세!
> XML 인코딩은 데이터를 해석하는 문자셋을 정의하며, 문서 최상단 <?xml version="1.0" encoding="UTF-8"?>로 선언합니다. UTF-8이 가장 표준적이며, 한글 깨짐 방지를 위해 파일 저장 시에도 반드시 같은 인코딩 형식을 사용해야 합니다. 선언을 생략하면 기본적으로 UTF-8 또는 UTF-16으로 간주됩니다

그렇구나. 1줄로 정리하면 아마 `UTF-8` 혹은 `UTF-16` 인코딩으로 쿼리 만들어라, 이거다.  

문제 설명에는 이번엔 계정 언급이 적혀있지 않다.  
부가적으로 유저 테이블을 확인하라는 명령을 받았다.  
즉, 테이블을 조회할 수 있어야 한다.  
어렵진 않은 것 같은데, 방법을 찾아보겠다.  

버전을 확인하기 위해 바로  
`union SELECT * FROM v$version ' --`
사용해 보았지만 역시나 되지 않는다.  

어... 문제 설명에 힌트가 있었다. 대강 짐작했던 대로  
인코딩에 필요한 도구가 있나보다. `burp suite`에 플러그인 형식으로 설치하여 쓸 수 있다고 한다. 그래서 이 문제는 내일 풀어서 다른 문제들과 같이 올리려고 한다.

---

이대로 자긴 아까우니 아까 못 쓴 롸업을 쓰고,  
플러그인 설치한 뒤 맥북에 기드라도 깔고 자야겠다.  
글 올리는 시간은 9:59다. 어쩌다 보니 일정이 이렇게 바뀌었다.  