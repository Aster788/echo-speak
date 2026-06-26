# A/B: Sync vs LLM clean + extract

**Video:** 29 easy things that make you a cool person
**Generated:** 2026-06-26

## Summary

| Metric | Sync clean | LLM clean | DB (current) |
|--------|------------|-----------|--------------|
| raw_text chars | 6269 | 6269 | — |
| cleaned_text chars | 4640 | 4641 | 4653 |
| expressions extracted | 20 | 20 | — |
| DB cleaned == sync | — | — | no |

| Phrase overlap | Count |
|----------------|-------|
| Exact phrase match (both paths) | 3 |
| Sync-only phrases | 17 |
| LLM-only phrases | 17 |

## Side-by-side (all expressions)

Compare **Sync clean → extract** (left) vs **LLM clean → extract** (right). Mark quality in Notes column if reviewing manually.

| # | Sync: phrase | Sync: example_en | LLM: phrase | LLM: example_en |
|---|--------------|------------------|-------------|-----------------|
| 1 | make someone's day | It made my day when strangers warned me about the broken glass. | made my day | It made my day, and it got me thinking about random nice things that people do. |
| 2 | wholesome as hell | If you’re looking for a wholesome as hell video, look no further. | wholesome as hell | If you’re looking for a wholesome as hell video, look no further. |
| 3 | look no further | If you’re looking for a wholesome as hell video, look no further. | look no further | If you’re looking for a wholesome as hell video, look no further. |
| 4 | block someone out | This one person is literally standing right in front of you, blocking you out. | blocking you out | You know when you’re standing with a group of people and this one person is literally standing right in front of you, blocking you out? |
| 5 | cheers to | Cheers to the person who notices and takes a step back so that you’re also included. | takes a step back | Cheers to the person who notices and takes a step back so that you’re also included. |
| 6 | take a step back | Cheers to the person who notices and takes a step back so that you’re also included. | include others in general | Just people who include others in general. |
| 7 | tie your shoe | That one person who stops and waits for you while you tie your shoe. | tie your shoe | That one person who stops and waits for you while you tie your shoe. |
| 8 | hold the door for someone | Holding the door for others, but not when they’re too far away because then they have to do that awkward little run. | holding the door for others | Holding the door for others, but not when they’re too far away because then they have to do that awkward little run. |
| 9 | text someone when you get home safe | When someone asks you to text them when you get home safe. | text them when you get home safe | When someone asks you to text them when you get home safe. |
| 10 | hype up | When someone hypes up your taste in music. | hypes up your taste in music | When someone hypes up your taste in music. |
| 11 | run into someone | The person who doesn’t let you stand there awkwardly when they run into someone they know. | notices a change you made to your appearance | When someone notices a change you made to your appearance. |
| 12 | scooch over | When you want to take a seat but there’s no more room and someone scooches over for you. | get excited when you get excited | People who get excited when you get excited. |
| 13 | maintain eye contact | There’s that one person who maintains eye contact, waiting for you to continue. | scooches over | When you want to take a seat but there’s no more room and someone scooches over for you. |
| 14 | let someone go ahead of you | The person in front of you with their cart full lets you go ahead of them. | maintains eye contact | There’s that one person who maintains eye contact, waiting for you to continue. |
| 15 | pick something up | When something’s fallen off a shelf in the grocery store and you see someone picking it up. | lets you go ahead of them | The person in front of you with their cart full lets you go ahead of them. |
| 16 | let someone in | Seeing someone let someone else in when there’s traffic. | picking it up rather than just walking past it | You see someone picking it up rather than just walking past it. |
| 17 | circle back to someone | When someone actually circles back to you about the thing you recommended. | acknowledging people's presence | I notice there’s a lot of “acknowledging people's presence.” |
| 18 | get back to someone on something | Later they get back to you on it because they actually listened to it. | circles back to you | When someone actually circles back to you about the thing you recommended them. |
| 19 | hype someone up | People who hype you up when they know you’ve been struggling with something. | hype you up | People who hype you up when they know you’ve been struggling with something. |
| 20 | thank someone for a service | If you’re not thanking uber drivers, waiters and anyone offering you a service, you better start right now! | thanking Uber drivers, waiters, and anyone offering you a service | If you’re not thanking Uber drivers, waiters, and anyone offering you a service, you better start right now! |

## Sync path — full detail

#### 1. make someone's day

- **meaning:** 让某人一整天都很开心
- **example_en:** It made my day when strangers warned me about the broken glass.
- **topic:** social

#### 2. wholesome as hell

- **meaning:** 非常暖心/治愈
- **example_en:** If you’re looking for a wholesome as hell video, look no further.
- **topic:** uncategorized

#### 3. look no further

- **meaning:** 不用再找了
- **example_en:** If you’re looking for a wholesome as hell video, look no further.
- **topic:** uncategorized

#### 4. block someone out

- **meaning:** 挡住某人（视线或参与）
- **example_en:** This one person is literally standing right in front of you, blocking you out.
- **topic:** social

#### 5. cheers to

- **meaning:** 为……喝彩/致敬
- **example_en:** Cheers to the person who notices and takes a step back so that you’re also included.
- **topic:** social

#### 6. take a step back

- **meaning:** 退后一步
- **example_en:** Cheers to the person who notices and takes a step back so that you’re also included.
- **topic:** social

#### 7. tie your shoe

- **meaning:** 系鞋带
- **example_en:** That one person who stops and waits for you while you tie your shoe.
- **topic:** daily

#### 8. hold the door for someone

- **meaning:** 为某人扶门
- **example_en:** Holding the door for others, but not when they’re too far away because then they have to do that awkward little run.
- **topic:** social

#### 9. text someone when you get home safe

- **meaning:** 到家后发短信报平安
- **example_en:** When someone asks you to text them when you get home safe.
- **topic:** social

#### 10. hype up

- **meaning:** 大力赞扬/捧场
- **example_en:** When someone hypes up your taste in music.
- **topic:** social

#### 11. run into someone

- **meaning:** 偶遇某人
- **example_en:** The person who doesn’t let you stand there awkwardly when they run into someone they know.
- **topic:** social

#### 12. scooch over

- **meaning:** 挪过去一点
- **example_en:** When you want to take a seat but there’s no more room and someone scooches over for you.
- **topic:** social

#### 13. maintain eye contact

- **meaning:** 保持眼神交流
- **example_en:** There’s that one person who maintains eye contact, waiting for you to continue.
- **topic:** social

#### 14. let someone go ahead of you

- **meaning:** 让某人先走/先结账
- **example_en:** The person in front of you with their cart full lets you go ahead of them.
- **topic:** grocery

#### 15. pick something up

- **meaning:** 捡起某物
- **example_en:** When something’s fallen off a shelf in the grocery store and you see someone picking it up.
- **topic:** grocery

#### 16. let someone in

- **meaning:** 让某人插队/进入
- **example_en:** Seeing someone let someone else in when there’s traffic.
- **topic:** daily

#### 17. circle back to someone

- **meaning:** 回头再回复某人
- **example_en:** When someone actually circles back to you about the thing you recommended.
- **topic:** social

#### 18. get back to someone on something

- **meaning:** 就某事回复某人
- **example_en:** Later they get back to you on it because they actually listened to it.
- **topic:** social

#### 19. hype someone up

- **meaning:** 给某人打气/喝彩
- **example_en:** People who hype you up when they know you’ve been struggling with something.
- **topic:** social

#### 20. thank someone for a service

- **meaning:** 感谢某人的服务
- **example_en:** If you’re not thanking uber drivers, waiters and anyone offering you a service, you better start right now!
- **topic:** social

## LLM path — full detail

#### 1. made my day

- **meaning:** 让我一整天都很开心
- **example_en:** It made my day, and it got me thinking about random nice things that people do.
- **topic:** social

#### 2. wholesome as hell

- **meaning:** 非常暖心/治愈
- **example_en:** If you’re looking for a wholesome as hell video, look no further.
- **topic:** social

#### 3. look no further

- **meaning:** 不用再找了
- **example_en:** If you’re looking for a wholesome as hell video, look no further.
- **topic:** uncategorized

#### 4. blocking you out

- **meaning:** 把你挡在外面/忽略你
- **example_en:** You know when you’re standing with a group of people and this one person is literally standing right in front of you, blocking you out?
- **topic:** social

#### 5. takes a step back

- **meaning:** 退后一步
- **example_en:** Cheers to the person who notices and takes a step back so that you’re also included.
- **topic:** social

#### 6. include others in general

- **meaning:** 总体上包容他人
- **example_en:** Just people who include others in general.
- **topic:** social

#### 7. tie your shoe

- **meaning:** 系鞋带
- **example_en:** That one person who stops and waits for you while you tie your shoe.
- **topic:** daily

#### 8. holding the door for others

- **meaning:** 为别人扶门
- **example_en:** Holding the door for others, but not when they’re too far away because then they have to do that awkward little run.
- **topic:** social

#### 9. text them when you get home safe

- **meaning:** 到家后发短信报平安
- **example_en:** When someone asks you to text them when you get home safe.
- **topic:** social

#### 10. hypes up your taste in music

- **meaning:** 大力夸赞你的音乐品味
- **example_en:** When someone hypes up your taste in music.
- **topic:** social

#### 11. notices a change you made to your appearance

- **meaning:** 注意到你外表的变化
- **example_en:** When someone notices a change you made to your appearance.
- **topic:** social

#### 12. get excited when you get excited

- **meaning:** 你兴奋时也跟着兴奋
- **example_en:** People who get excited when you get excited.
- **topic:** social

#### 13. scooches over

- **meaning:** 挪过去一点（让出空间）
- **example_en:** When you want to take a seat but there’s no more room and someone scooches over for you.
- **topic:** social

#### 14. maintains eye contact

- **meaning:** 保持眼神交流
- **example_en:** There’s that one person who maintains eye contact, waiting for you to continue.
- **topic:** social

#### 15. lets you go ahead of them

- **meaning:** 让你先走/先结账
- **example_en:** The person in front of you with their cart full lets you go ahead of them.
- **topic:** grocery

#### 16. picking it up rather than just walking past it

- **meaning:** 捡起来而不是径直走过
- **example_en:** You see someone picking it up rather than just walking past it.
- **topic:** grocery

#### 17. acknowledging people's presence

- **meaning:** 认可/注意到他人的存在
- **example_en:** I notice there’s a lot of “acknowledging people's presence.”
- **topic:** social

#### 18. circles back to you

- **meaning:** 回头再跟你反馈
- **example_en:** When someone actually circles back to you about the thing you recommended them.
- **topic:** social

#### 19. hype you up

- **meaning:** 为你加油打气/捧场
- **example_en:** People who hype you up when they know you’ve been struggling with something.
- **topic:** social

#### 20. thanking Uber drivers, waiters, and anyone offering you a service

- **meaning:** 感谢优步司机、服务员等提供服务的人
- **example_en:** If you’re not thanking Uber drivers, waiters, and anyone offering you a service, you better start right now!
- **topic:** social

## Sync-only phrases

- **make someone's day** — It made my day when strangers warned me about the broken glass.
- **block someone out** — This one person is literally standing right in front of you, blocking you out.
- **cheers to** — Cheers to the person who notices and takes a step back so that you’re also included.
- **take a step back** — Cheers to the person who notices and takes a step back so that you’re also included.
- **hold the door for someone** — Holding the door for others, but not when they’re too far away because then they have to do that awkward little run.
- **text someone when you get home safe** — When someone asks you to text them when you get home safe.
- **hype up** — When someone hypes up your taste in music.
- **run into someone** — The person who doesn’t let you stand there awkwardly when they run into someone they know.
- **scooch over** — When you want to take a seat but there’s no more room and someone scooches over for you.
- **maintain eye contact** — There’s that one person who maintains eye contact, waiting for you to continue.
- **let someone go ahead of you** — The person in front of you with their cart full lets you go ahead of them.
- **pick something up** — When something’s fallen off a shelf in the grocery store and you see someone picking it up.
- **let someone in** — Seeing someone let someone else in when there’s traffic.
- **circle back to someone** — When someone actually circles back to you about the thing you recommended.
- **get back to someone on something** — Later they get back to you on it because they actually listened to it.
- **hype someone up** — People who hype you up when they know you’ve been struggling with something.
- **thank someone for a service** — If you’re not thanking uber drivers, waiters and anyone offering you a service, you better start right now!

## LLM-only phrases

- **made my day** — It made my day, and it got me thinking about random nice things that people do.
- **blocking you out** — You know when you’re standing with a group of people and this one person is literally standing right in front of you, blocking you out?
- **takes a step back** — Cheers to the person who notices and takes a step back so that you’re also included.
- **include others in general** — Just people who include others in general.
- **holding the door for others** — Holding the door for others, but not when they’re too far away because then they have to do that awkward little run.
- **text them when you get home safe** — When someone asks you to text them when you get home safe.
- **hypes up your taste in music** — When someone hypes up your taste in music.
- **notices a change you made to your appearance** — When someone notices a change you made to your appearance.
- **get excited when you get excited** — People who get excited when you get excited.
- **scooches over** — When you want to take a seat but there’s no more room and someone scooches over for you.
- **maintains eye contact** — There’s that one person who maintains eye contact, waiting for you to continue.
- **lets you go ahead of them** — The person in front of you with their cart full lets you go ahead of them.
- **picking it up rather than just walking past it** — You see someone picking it up rather than just walking past it.
- **acknowledging people's presence** — I notice there’s a lot of “acknowledging people's presence.”
- **circles back to you** — When someone actually circles back to you about the thing you recommended them.
- **hype you up** — People who hype you up when they know you’ve been struggling with something.
- **thanking Uber drivers, waiters, and anyone offering you a service** — If you’re not thanking Uber drivers, waiters, and anyone offering you a service, you better start right now!

## How to re-run

```bash
STATS_SUPABASE_URL=http://127.0.0.1:54321 \
STATS_SUPABASE_SERVICE_ROLE_KEY="$(supabase status --output json | python3 -c \"import sys,json; print(json.load(sys.stdin)['SERVICE_ROLE_KEY'])\")" \
npx tsx scripts/ab-clean-extract.ts --title-substr "29 easy things that "
```
