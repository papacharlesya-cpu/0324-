# 雙 Shuāng 每日戰情表：雲端補做工具

Mac 上的 `~/shuang-daily/warroom.py` 沒跑到時，在雲端對話裡補做日報用。
`build_daily.py` 不打 API，只負責把撈好的 Meta 數字依 warroom.py 口徑排成 Excel：

```
python3 shuang-warroom/build_daily.py input.json -o 日報20261010.xlsx
```

跑完終端會印每個帳戶的對帳行（分列＋略過 vs 帳戶總額），Excel 底部也有同樣的對帳區。

## 口徑（照記憶庫「雙 Shuāng 每日戰情表自動化 SOP」）

| 項目 | 規則 |
|---|---|
| 當日 | 報表日 00:00 到截止時刻（預設 18:00） |
| 近42小時 | 前一日整天 24h ＋ 當日 18h；截止時刻改了，標題會跟著算 |
| 在線素材數 | effective_status=ACTIVE 的**不重複廣告名稱**數，不是廣告則數 |
| 後台 ROAS | Meta 後台轉換金額 ÷ 花費，寫成 Excel 公式 |
| 原日預算 | 在線活動（CBO）或組合（ABO）的 daily_budget；跨列時按該活動近42h花費比例拆 |
| 幣別 | 全部台幣。SG 的花費、轉換金額、預算 × 25.1732；預算先除以幣別 offset（TWD 1、SGD 100） |
| TW 五列 | 活動名含「團購」或「流量」優先自成一列，其餘依廣告名稱抓抱抱／呼吸／輕提（輕輕Ｔ屬輕提）；命中 0 或 2 個系列就往組合→活動回退，三層都判不出的不出列，金額進對帳行 |
| HK 兩列 | 活動名含「轉換」全部併成一列，流量活動獨立 |
| SG | 依活動拆列；已停又沒花費的舊活動不出列 |
| 實銷、備註 | 留空，人工填 |

## input.json 格式

```json
{
  "report_date": "2026-10-10",
  "cutoff_hour": 18,
  "source": "Meta 官方 MCP",
  "fetched_at": "2026-10-11 09:30",
  "extra_notes": ["（選填）要寫進註記的話"],
  "accounts": {
    "TW": {
      "id": "act_2310836542585663",
      "currency": "TWD",
      "total_spend_day": 0,
      "total_spend_win": 0,
      "ads": [
        {
          "campaign_id": "", "campaign_name": "",
          "adset_id": "", "adset_name": "",
          "ad_id": "", "ad_name": "",
          "effective_status": "ACTIVE",
          "spend_day": 0, "value_day": 0,
          "spend_win": 0, "value_win": 0
        }
      ],
      "budgets": [
        {"level": "campaign", "id": "", "name": "", "daily_budget": "12000", "effective_status": "ACTIVE"}
      ]
    },
    "HK": {"id": "act_2008254346613028", "currency": "TWD", "...": "同上"},
    "SG": {"id": "act_754385507143013", "currency": "SGD", "...": "同上"}
  }
}
```

- 金額都填**帳戶原幣**（SG 填 SGD），換匯由程式做。
- `daily_budget` 填 Meta 回的原始值（最小單位），不要自己除。
- `value_*` 是購買轉換金額（action_values 裡的 purchase／offsite_conversion.fb_pixel_purchase，取一種不要重複加）。
- `ads` 要包含窗口內**有花費的所有廣告**（含已暫停的），以及目前在線的廣告（花費可為 0）。
- `total_spend_*` 是帳戶層級 insights 的總花費，用來對帳。

## 撈資料要注意

1. **當日要截在 18:00。** 18:00 之後才撈的話，當日要用小時拆分
   （`hourly_stats_aggregated_by_advertiser_time_zone`）只加總 00–17 時；近42小時＝前一日整天＋這段。
   TW、HK 帳戶時區是台北，SG 是新加坡，兩者都是 UTC+8，小時對得上。
2. **在線素材數與原日預算是撈取當下的狀態**，不是 18:00 的快照。隔天補做時，若帳戶活動紀錄顯示
   18:00 之後有開關或調預算，要在 `extra_notes` 註明。
3. HK 用的是**台幣帳戶** 2008254346613028，不是港幣帳戶。
