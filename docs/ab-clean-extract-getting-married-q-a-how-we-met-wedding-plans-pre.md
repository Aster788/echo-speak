# A/B: Sync vs LLM clean + extract

**Video:** Getting Married Q&A | how we met, wedding plans, prenup?
**Generated:** 2026-06-26

## Summary

| Metric | Sync clean | LLM clean | DB (current) |
|--------|------------|-----------|--------------|
| raw_text chars | 29602 | 29602 | — |
| cleaned_text chars | 21198 | 21164 | 21168 |
| expressions extracted | 38 | 35 | — |
| DB cleaned == sync | — | — | no |

| Phrase overlap | Count |
|----------------|-------|
| Exact phrase match (both paths) | 24 |
| Sync-only phrases | 14 |
| LLM-only phrases | 11 |

## Side-by-side (all expressions)

Compare **Sync clean → extract** (left) vs **LLM clean → extract** (right). Mark quality in Notes column if reviewing manually.

| # | Sync: phrase | Sync: example_en | LLM: phrase | LLM: example_en |
|---|--------------|------------------|-------------|-----------------|
| 1 | try things on | I couldn't really try things on it was kind of hard to tell if things would look good on me. | have my size | Nothing had my size. |
| 2 | fit perfectly | When I bought it at the store it fit perfectly. | try things on | I couldn't really try things on. |
| 3 | way too big | Very soon after it was way too big for me. | way too big | It was way too big for me. |
| 4 | no judgment | Lab grown? No judgment, just curious. | no judgment | Lab grown? No judgment, just curious. |
| 5 | can't tell the difference | It looks the same to me, you can't tell the difference honestly. | can't justify it | I just can't justify it. |
| 6 | go with | I decided to go with lab grown. | nick on the side | I would be afraid of nicking on the side. |
| 7 | keep my name | I kept my name. | go with | I decided to go with lab grown. |
| 8 | elephant in the room | Big big big elephant in the room: did we sign a prenup? | elephant in the room | Big big elephant in the room. |
| 9 | reach out to | I actually did reach out to a family lawyer. | sound financial decisions | That can influence your ability to make sound financial decisions. |
| 10 | make sound financial decisions | Something about how that can influence your ability to make sound financial decisions. | out of work | Does being out of work make finance conversations awkward? |
| 11 | financial literacy | At the beginning because you had no financial literacy. | financial literacy | You had no financial literacy. |
| 12 | make far less money | I was really insecure cuz I made far less money. | make far less money | I made far less money. |
| 13 | split 50/50 | The mortgage we split 50/50. | split 50/50 | We split 50/50. |
| 14 | get back in the game | You knew that would get back in the game. | get back in the game | You knew that would get back in the game. |
| 15 | cover my life expenses | I hate having to owe someone else which is why I want to cover my life expenses. | owe someone | I hate having to owe someone else. |
| 16 | joint banking account | We have one joint banking account. | evens out | We just kind of assume it evens out. |
| 17 | keep track of | It's just easier to keep track of. | joint banking account | We have one joint banking account. |
| 18 | authorized credit card user | Add each other as like authorized credit card user. | keep track of | It's easier to keep track of. |
| 19 | big spender | I wouldn't say that I'm a big spender. | authorized credit card user | Add each other as authorized credit card user. |
| 20 | points of tension | The biggest points of tension when it comes to divorce are money, wedding, kids. | huffing and puffing | She was just huffing and puffing. |
| 21 | family feuds | For 6 months to a year to 2 years there's all these family feuds. | family feuds | There's all these family feuds, it's money. |
| 22 | food sucks | The food sucks, hotel food is nasty. | food sucks | The food sucks, food is always sopp hotel food is nasty. |
| 23 | whole ass or no ass | Knowing me I go all the way, I whole ass or no ass. | whole ass or no ass | Knowing me, I go all the way, I whole ass or no ass. |
| 24 | rates are much better | I think the rates are much better and the food probably should be a lot better. | work on yourself | I would say work on yourself, be hot, go out there and meet people. |
| 25 | full of joy | My parents were so happy they were full of joy. | flirting is a skill | Learn to flirt, flirting is a skill. |
| 26 | dress up | They dressed up, I've never seen them dress up ever. | make someone be curious of you | Being able to make someone be curious of you. |
| 27 | work on yourself | I would say work on yourself, be hot, go out there and meet people. | exchange numbers | Make sure you exchange numbers. |
| 28 | flirting is a skill | Learn to flirt, flirting is a skill. | dating is a hard game | Dating is a hard game. |
| 29 | be thoughtful | Be thoughtful, remember people's details, compliment people a lot. | comes when you least expect it | Dating comes when you least expect it. |
| 30 | exchange numbers | Make sure you exchange numbers, exchange their insta. | check boxes | Not everyone fits all of the check boxes. |
| 31 | dating is a hard game | Dating is a hard game, dating comes when you least expect it. | having the spark | Two people having the spark working towards each other. |
| 32 | least expect it | Dating comes when you least expect it. | coming clean | If there's mistakes made or things you're ashamed of, coming clean takes you really far. |
| 33 | check boxes | Not everyone fits all of the check boxes, it's about compromise too. | dating apps | Dating apps are real and a lot of my friends met their partners through them. |
| 34 | have the spark | It's about two people having the spark working towards each other. | tune in | Thank you for tuning in on this getting married Q&A. |
| 35 | coming clean | If there's mistakes made or things you're ashamed of, I do think coming clean takes you really far. | bring value to your life | I hope that I bring value to your life. |
| 36 | dating apps | Dating apps are real and a lot of my friends met their partners through dating apps. | — | — |
| 37 | tune in | Thank you for tuning in on this getting married Q&A. | — | — |
| 38 | bring value to your life | I hope that I bring value to your life. | — | — |

## Sync path — full detail

#### 1. try things on

- **meaning:** 试穿
- **example_en:** I couldn't really try things on it was kind of hard to tell if things would look good on me.
- **topic:** shopping

#### 2. fit perfectly

- **meaning:** 非常合身
- **example_en:** When I bought it at the store it fit perfectly.
- **topic:** shopping

#### 3. way too big

- **meaning:** 太大了
- **example_en:** Very soon after it was way too big for me.
- **topic:** shopping

#### 4. no judgment

- **meaning:** 没有评判
- **example_en:** Lab grown? No judgment, just curious.
- **topic:** social

#### 5. can't tell the difference

- **meaning:** 看不出区别
- **example_en:** It looks the same to me, you can't tell the difference honestly.
- **topic:** shopping

#### 6. go with

- **meaning:** 选择
- **example_en:** I decided to go with lab grown.
- **topic:** shopping

#### 7. keep my name

- **meaning:** 保留姓氏
- **example_en:** I kept my name.
- **topic:** social

#### 8. elephant in the room

- **meaning:** 显而易见但尴尬的问题
- **example_en:** Big big big elephant in the room: did we sign a prenup?
- **topic:** social

#### 9. reach out to

- **meaning:** 联系
- **example_en:** I actually did reach out to a family lawyer.
- **topic:** social

#### 10. make sound financial decisions

- **meaning:** 做出明智的财务决策
- **example_en:** Something about how that can influence your ability to make sound financial decisions.
- **topic:** work

#### 11. financial literacy

- **meaning:** 财务素养
- **example_en:** At the beginning because you had no financial literacy.
- **topic:** work

#### 12. make far less money

- **meaning:** 赚得少得多
- **example_en:** I was really insecure cuz I made far less money.
- **topic:** work

#### 13. split 50/50

- **meaning:** 平摊
- **example_en:** The mortgage we split 50/50.
- **topic:** work

#### 14. get back in the game

- **meaning:** 重新振作
- **example_en:** You knew that would get back in the game.
- **topic:** work

#### 15. cover my life expenses

- **meaning:** 支付生活开销
- **example_en:** I hate having to owe someone else which is why I want to cover my life expenses.
- **topic:** work

#### 16. joint banking account

- **meaning:** 联名银行账户
- **example_en:** We have one joint banking account.
- **topic:** work

#### 17. keep track of

- **meaning:** 跟踪
- **example_en:** It's just easier to keep track of.
- **topic:** daily

#### 18. authorized credit card user

- **meaning:** 授权信用卡用户
- **example_en:** Add each other as like authorized credit card user.
- **topic:** work

#### 19. big spender

- **meaning:** 大手大脚花钱的人
- **example_en:** I wouldn't say that I'm a big spender.
- **topic:** shopping

#### 20. points of tension

- **meaning:** 紧张点
- **example_en:** The biggest points of tension when it comes to divorce are money, wedding, kids.
- **topic:** social

#### 21. family feuds

- **meaning:** 家庭纠纷
- **example_en:** For 6 months to a year to 2 years there's all these family feuds.
- **topic:** social

#### 22. food sucks

- **meaning:** 食物很难吃
- **example_en:** The food sucks, hotel food is nasty.
- **topic:** dining-out

#### 23. whole ass or no ass

- **meaning:** 要么全力以赴，要么不做
- **example_en:** Knowing me I go all the way, I whole ass or no ass.
- **topic:** uncategorized

#### 24. rates are much better

- **meaning:** 价格更优惠
- **example_en:** I think the rates are much better and the food probably should be a lot better.
- **topic:** shopping

#### 25. full of joy

- **meaning:** 充满喜悦
- **example_en:** My parents were so happy they were full of joy.
- **topic:** social

#### 26. dress up

- **meaning:** 盛装打扮
- **example_en:** They dressed up, I've never seen them dress up ever.
- **topic:** social

#### 27. work on yourself

- **meaning:** 提升自己
- **example_en:** I would say work on yourself, be hot, go out there and meet people.
- **topic:** daily

#### 28. flirting is a skill

- **meaning:** 调情是一种技能
- **example_en:** Learn to flirt, flirting is a skill.
- **topic:** social

#### 29. be thoughtful

- **meaning:** 体贴周到
- **example_en:** Be thoughtful, remember people's details, compliment people a lot.
- **topic:** social

#### 30. exchange numbers

- **meaning:** 交换电话号码
- **example_en:** Make sure you exchange numbers, exchange their insta.
- **topic:** social

#### 31. dating is a hard game

- **meaning:** 约会很难
- **example_en:** Dating is a hard game, dating comes when you least expect it.
- **topic:** social

#### 32. least expect it

- **meaning:** 最意想不到的时候
- **example_en:** Dating comes when you least expect it.
- **topic:** uncategorized

#### 33. check boxes

- **meaning:** 条件清单
- **example_en:** Not everyone fits all of the check boxes, it's about compromise too.
- **topic:** social

#### 34. have the spark

- **meaning:** 有火花
- **example_en:** It's about two people having the spark working towards each other.
- **topic:** social

#### 35. coming clean

- **meaning:** 坦白交代
- **example_en:** If there's mistakes made or things you're ashamed of, I do think coming clean takes you really far.
- **topic:** social

#### 36. dating apps

- **meaning:** 约会软件
- **example_en:** Dating apps are real and a lot of my friends met their partners through dating apps.
- **topic:** social

#### 37. tune in

- **meaning:** 收看/收听
- **example_en:** Thank you for tuning in on this getting married Q&A.
- **topic:** daily

#### 38. bring value to your life

- **meaning:** 给你的生活带来价值
- **example_en:** I hope that I bring value to your life.
- **topic:** uncategorized

## LLM path — full detail

#### 1. have my size

- **meaning:** 有我的尺码
- **example_en:** Nothing had my size.
- **topic:** shopping

#### 2. try things on

- **meaning:** 试穿
- **example_en:** I couldn't really try things on.
- **topic:** shopping

#### 3. way too big

- **meaning:** 太大了
- **example_en:** It was way too big for me.
- **topic:** shopping

#### 4. no judgment

- **meaning:** 没有评判，只是好奇
- **example_en:** Lab grown? No judgment, just curious.
- **topic:** social

#### 5. can't justify it

- **meaning:** 无法证明其合理性，觉得不值
- **example_en:** I just can't justify it.
- **topic:** shopping

#### 6. nick on the side

- **meaning:** 在边上磕碰
- **example_en:** I would be afraid of nicking on the side.
- **topic:** daily

#### 7. go with

- **meaning:** 选择，决定用
- **example_en:** I decided to go with lab grown.
- **topic:** shopping

#### 8. elephant in the room

- **meaning:** 显而易见却避而不谈的问题
- **example_en:** Big big elephant in the room.
- **topic:** social

#### 9. sound financial decisions

- **meaning:** 明智的财务决策
- **example_en:** That can influence your ability to make sound financial decisions.
- **topic:** work

#### 10. out of work

- **meaning:** 失业
- **example_en:** Does being out of work make finance conversations awkward?
- **topic:** work

#### 11. financial literacy

- **meaning:** 财务知识
- **example_en:** You had no financial literacy.
- **topic:** work

#### 12. make far less money

- **meaning:** 赚得少得多
- **example_en:** I made far less money.
- **topic:** work

#### 13. split 50/50

- **meaning:** 平摊，各付一半
- **example_en:** We split 50/50.
- **topic:** work

#### 14. get back in the game

- **meaning:** 重新回到职场/游戏中
- **example_en:** You knew that would get back in the game.
- **topic:** work

#### 15. owe someone

- **meaning:** 欠某人
- **example_en:** I hate having to owe someone else.
- **topic:** social

#### 16. evens out

- **meaning:** 持平，差不多
- **example_en:** We just kind of assume it evens out.
- **topic:** work

#### 17. joint banking account

- **meaning:** 联名银行账户
- **example_en:** We have one joint banking account.
- **topic:** work

#### 18. keep track of

- **meaning:** 记录，跟踪
- **example_en:** It's easier to keep track of.
- **topic:** daily

#### 19. authorized credit card user

- **meaning:** 授权信用卡用户
- **example_en:** Add each other as authorized credit card user.
- **topic:** work

#### 20. huffing and puffing

- **meaning:** 气喘吁吁，这里指不舒服地喘气
- **example_en:** She was just huffing and puffing.
- **topic:** daily

#### 21. family feuds

- **meaning:** 家庭纠纷
- **example_en:** There's all these family feuds, it's money.
- **topic:** social

#### 22. food sucks

- **meaning:** 食物很难吃
- **example_en:** The food sucks, food is always sopp hotel food is nasty.
- **topic:** dining-out

#### 23. whole ass or no ass

- **meaning:** 要么全力以赴，要么不做
- **example_en:** Knowing me, I go all the way, I whole ass or no ass.
- **topic:** uncategorized

#### 24. work on yourself

- **meaning:** 提升自己
- **example_en:** I would say work on yourself, be hot, go out there and meet people.
- **topic:** productivity

#### 25. flirting is a skill

- **meaning:** 调情是一门技巧
- **example_en:** Learn to flirt, flirting is a skill.
- **topic:** social

#### 26. make someone be curious of you

- **meaning:** 让对方对你产生好奇
- **example_en:** Being able to make someone be curious of you.
- **topic:** social

#### 27. exchange numbers

- **meaning:** 交换电话号码
- **example_en:** Make sure you exchange numbers.
- **topic:** social

#### 28. dating is a hard game

- **meaning:** 约会是一场艰难的游戏
- **example_en:** Dating is a hard game.
- **topic:** social

#### 29. comes when you least expect it

- **meaning:** 在你最意想不到的时候到来
- **example_en:** Dating comes when you least expect it.
- **topic:** social

#### 30. check boxes

- **meaning:** 满足条件
- **example_en:** Not everyone fits all of the check boxes.
- **topic:** uncategorized

#### 31. having the spark

- **meaning:** 有火花
- **example_en:** Two people having the spark working towards each other.
- **topic:** social

#### 32. coming clean

- **meaning:** 坦白交代
- **example_en:** If there's mistakes made or things you're ashamed of, coming clean takes you really far.
- **topic:** social

#### 33. dating apps

- **meaning:** 约会软件
- **example_en:** Dating apps are real and a lot of my friends met their partners through them.
- **topic:** social

#### 34. tune in

- **meaning:** 收看/收听
- **example_en:** Thank you for tuning in on this getting married Q&A.
- **topic:** daily

#### 35. bring value to your life

- **meaning:** 给你的生活带来价值
- **example_en:** I hope that I bring value to your life.
- **topic:** uncategorized

## Sync-only phrases

- **fit perfectly** — When I bought it at the store it fit perfectly.
- **can't tell the difference** — It looks the same to me, you can't tell the difference honestly.
- **keep my name** — I kept my name.
- **reach out to** — I actually did reach out to a family lawyer.
- **make sound financial decisions** — Something about how that can influence your ability to make sound financial decisions.
- **cover my life expenses** — I hate having to owe someone else which is why I want to cover my life expenses.
- **big spender** — I wouldn't say that I'm a big spender.
- **points of tension** — The biggest points of tension when it comes to divorce are money, wedding, kids.
- **rates are much better** — I think the rates are much better and the food probably should be a lot better.
- **full of joy** — My parents were so happy they were full of joy.
- **dress up** — They dressed up, I've never seen them dress up ever.
- **be thoughtful** — Be thoughtful, remember people's details, compliment people a lot.
- **least expect it** — Dating comes when you least expect it.
- **have the spark** — It's about two people having the spark working towards each other.

## LLM-only phrases

- **have my size** — Nothing had my size.
- **can't justify it** — I just can't justify it.
- **nick on the side** — I would be afraid of nicking on the side.
- **sound financial decisions** — That can influence your ability to make sound financial decisions.
- **out of work** — Does being out of work make finance conversations awkward?
- **owe someone** — I hate having to owe someone else.
- **evens out** — We just kind of assume it evens out.
- **huffing and puffing** — She was just huffing and puffing.
- **make someone be curious of you** — Being able to make someone be curious of you.
- **comes when you least expect it** — Dating comes when you least expect it.
- **having the spark** — Two people having the spark working towards each other.

## How to re-run

```bash
STATS_SUPABASE_URL=http://127.0.0.1:54321 \
STATS_SUPABASE_SERVICE_ROLE_KEY="$(supabase status --output json | python3 -c \"import sys,json; print(json.load(sys.stdin)['SERVICE_ROLE_KEY'])\")" \
npx tsx scripts/ab-clean-extract.ts --title-substr "Getting Married Q&A "
```
