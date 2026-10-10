#!/usr/bin/env python3
"""雙 Shuāng 每日戰情表（雲端補做版）：把 Meta 撈下來的數字依 warroom.py 口徑排成 Excel。

用法：
    python3 build_daily.py input.json [-o 日報20261010.xlsx]

input.json 的格式見 README.md。這支只負責「分列、換匯、拆預算、排版、對帳」，
不打 API；資料由當次對話用 Meta MCP 撈好、整理成 input.json 再丟進來。

口徑（照記憶庫「雙 Shuāng 每日戰情表自動化 SOP」與 9/19–9/20 的定案）：
- 當日＝報表日 00:00 到截止時刻；近N小時＝前一天整天＋當日（18:00 截止就是近42小時）
- 在線素材數＝effective_status=ACTIVE 的不重複廣告名稱數（不是廣告則數）
- TW 五列：活動名含「團購」或「流量」優先自成一列，其餘依廣告名稱抓系列
  （抱抱／呼吸／輕提，輕輕Ｔ屬輕提），命中 0 或 2 個以上系列就往組合→活動回退，
  三層都判不出的歸「其他」：不出列，但金額進對帳行
- HK 兩列：活動名含「轉換」一律併成一列，流量活動獨立
- SG 依活動拆列
- CBO／ABO 的日預算跨列時，按該活動（組合）近N小時花費比例拆帳
- 全部台幣：SGD 花費、轉換金額、預算都乘 SGD_TWD；預算先依幣別 offset 換成元
- ROAS 寫成 Excel 公式；實銷、備註留空
"""
import argparse
import json
import sys
from collections import defaultdict

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

SGD_TWD = 25.1732  # 記憶庫定案匯率；要調只動這一行
FX = {"TWD": 1.0, "SGD": SGD_TWD}
BUDGET_OFFSET = {"TWD": 1, "SGD": 100}  # Meta daily_budget 是該幣別最小單位

MARKETS = [
    ("TW", "台灣"),
    ("HK", "香港(台幣帳戶)"),
    ("SG", "新加坡(台幣計算)"),
]
TW_ROWS = ["團購", "流量", "抱抱", "呼吸", "輕提"]
SERIES = [
    ("抱抱", ("抱抱", "ProFit", "Pro Fit")),
    ("呼吸", ("呼吸",)),
    ("輕提", ("輕輕提", "輕提", "輕輕T", "輕輕Ｔ")),
]
OTHER = "其他"


def series_of(name):
    hits = [s for s, kws in SERIES if any(k in (name or "") for k in kws)]
    return hits[0] if len(hits) == 1 else None


def tw_key(ad):
    camp = ad["campaign_name"]
    if "團購" in camp:
        return "團購", "活動名含團購"
    if "流量" in camp:
        return "流量", "活動名含流量"
    for level, field in (("廣告", "ad_name"), ("組合", "adset_name"), ("活動", "campaign_name")):
        s = series_of(ad.get(field))
        if s:
            return s, f"{level}名稱"
    return OTHER, "三層都判不出系列"


def hk_key(ad):
    camp = ad["campaign_name"]
    if "轉換" in camp:
        return "[HK] 官網常態_轉換（全部合併）", "活動名含轉換"
    if "流量" in camp:
        return camp, "流量活動獨立"
    return OTHER, "非轉換／流量活動"


def sg_key(ad):
    return ad["campaign_name"], "依活動"


KEY_FN = {"TW": tw_key, "HK": hk_key, "SG": sg_key}


def num(v):
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def build_rows(mkt, acct, fx, win_h=42, budget_major=False):
    """回傳 (rows, other, detail)。rows: 列名 -> 指標；other: 被略過的金額。"""
    keyfn = KEY_FN[mkt]
    rows = defaultdict(lambda: {"names": set(), "spend_day": 0.0, "value_day": 0.0,
                                "spend_win": 0.0, "value_win": 0.0, "budget": 0.0,
                                "campaigns": set()})
    detail = []
    ad_bucket = {}
    # 每個活動／組合在各列的近N小時花費，拆預算用
    win_by_camp = defaultdict(lambda: defaultdict(float))
    win_by_adset = defaultdict(lambda: defaultdict(float))
    # 每個活動／組合在各列的在線素材名稱，近N小時零花費時按素材數拆預算
    active_by_camp = defaultdict(lambda: defaultdict(set))
    active_by_adset = defaultdict(lambda: defaultdict(set))

    for ad in acct["ads"]:
        key, why = keyfn(ad)
        ad_bucket[ad["ad_id"]] = key
        r = rows[key]
        active = ad.get("effective_status") == "ACTIVE"
        if active:
            r["names"].add(ad["ad_name"].strip())
            active_by_camp[ad["campaign_id"]][key].add(ad["ad_name"].strip())
            active_by_adset[ad["adset_id"]][key].add(ad["ad_name"].strip())
        for f in ("spend_day", "value_day", "spend_win", "value_win"):
            r[f] += num(ad.get(f)) * fx
        r["campaigns"].add(ad["campaign_name"])
        win_by_camp[ad["campaign_id"]][key] += num(ad.get("spend_win")) * fx
        win_by_adset[ad["adset_id"]][key] += num(ad.get("spend_win")) * fx
        detail.append((mkt, key, why, ad))

    cur = acct["currency"]
    budget_notes = []
    for b in acct.get("budgets", []):
        if b.get("effective_status", "ACTIVE") != "ACTIVE" or not b.get("daily_budget"):
            continue
        offset = 1 if budget_major else BUDGET_OFFSET[cur]  # 官方 MCP 回的預算已是元
        amount = num(b["daily_budget"]) / offset * fx
        if b["level"] == "campaign":
            spend_split, active_keys = win_by_camp.get(b["id"], {}), active_by_camp.get(b["id"], {})
        else:
            spend_split, active_keys = win_by_adset.get(b["id"], {}), active_by_adset.get(b["id"], {})
        total = sum(spend_split.values())
        n_active = sum(len(v) for v in active_keys.values())
        if total > 0:
            shares = {k: v / total for k, v in spend_split.items() if v > 0}
        elif n_active:
            # 10/5 修正：近N小時花費全為 0 時改按在線素材數分，避免除以零
            shares = {k: len(v) / n_active for k, v in active_keys.items() if v}
        else:
            budget_notes.append(f"{mkt} {b['level']} {b['id']} 日預算 {amount:,.0f} 無在線廣告也無花費，未計入")
            continue
        if len(shares) > 1:
            budget_notes.append(f"{mkt} {b.get('name', b['id'])} 日預算 {amount:,.0f} 跨 {len(shares)} 列，按近{win_h}小時花費比例拆")
        for k, s in shares.items():
            rows[k]["budget"] += amount * s

    other = rows.pop(OTHER, None)
    if mkt == "TW":
        for k in TW_ROWS:
            rows[k]  # 五列固定出現，沒花費也列 0
    elif mkt == "SG":
        for k in [k for k, r in rows.items() if not r["names"] and r["spend_win"] == 0]:
            rows.pop(k)  # 已停又沒花費的舊活動不出列
    return rows, other, detail, budget_notes


def tw_label(key, r):
    if key in ("團購", "流量") and r["campaigns"]:
        camps = sorted(r["campaigns"])
        return f"[TW] {key}：{camps[0]}" if len(camps) == 1 else f"[TW] {key}（{len(camps)} 檔合併）"
    return f"[TW] {key}系列" if key in ("抱抱", "呼吸", "輕提") else f"[TW] {key}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("-o", "--output")
    args = ap.parse_args()
    data = json.load(open(args.input, encoding="utf-8"))

    rd = data["report_date"]  # YYYY-MM-DD
    cutoff = int(data.get("cutoff_hour", 18))
    win_h = 24 + cutoff
    y, m, d = rd.split("-")
    out = args.output or f"日報{y}{m}{d}.xlsx"

    wb = Workbook()
    ws = wb.active
    ws.title = "日報"
    thin = Side(style="thin", color="C9CDD6")
    box = Border(left=thin, right=thin, top=thin, bottom=thin)
    hdr_fill = PatternFill("solid", fgColor="1F3A5F")
    mkt_fill = PatternFill("solid", fgColor="E8EEF7")
    sub_fill = PatternFill("solid", fgColor="F3F4F6")
    rec_fill = PatternFill("solid", fgColor="FFF7E6")
    bold = Font(bold=True)

    ws["A1"] = f"雙 Shuāng 每日戰情表　{y}/{m}/{d}（資料截至 {cutoff:02d}:00）"
    ws["A1"].font = Font(bold=True, size=14)
    ws["A2"] = (f"當日＝{m}/{d} 00:00–{cutoff:02d}:00；近{win_h}小時＝前一日整天＋當日。"
                f"全部台幣，SGD×{SGD_TWD}。ROAS＝Meta 後台轉換金額÷花費。")
    ws["A2"].font = Font(size=9, color="6B7280")

    heads = ["市場", "分列", "在線素材數", "當日花費", "當日後台轉換金額", "當日後台ROAS",
             f"近{win_h}小時花費", f"近{win_h}小時後台轉換金額", f"近{win_h}小時後台ROAS",
             "原日預算", "實銷", "備註"]
    widths = [16, 52, 11, 13, 16, 13, 15, 19, 16, 13, 12, 28]
    for i, (h, w) in enumerate(zip(heads, widths), 1):
        c = ws.cell(row=4, column=i, value=h)
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = hdr_fill
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = box
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[4].height = 30
    ws.freeze_panes = "C5"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True

    money = '#,##0'
    roas = '0.00'
    row = 5
    recon = []
    all_detail = []
    notes = []
    for mkt, title in MARKETS:
        acct = data["accounts"].get(mkt)
        if not acct:
            notes.append(f"{title}：輸入檔沒有此帳戶資料")
            continue
        fx = FX[acct["currency"]]
        rows, other, detail, bnotes = build_rows(mkt, acct, fx, win_h, data.get("budget_in_major_units", False))
        all_detail += detail
        notes += bnotes

        c = ws.cell(row=row, column=1, value=f"{title}　{acct['id']}（{acct['currency']}）")
        c.font = bold
        for col in range(1, 13):
            ws.cell(row=row, column=col).fill = mkt_fill
            ws.cell(row=row, column=col).border = box
        row += 1

        first = row
        order = TW_ROWS if mkt == "TW" else sorted(rows, key=lambda k: (-rows[k]["spend_win"], k))
        for key in order:
            r = rows[key]
            label = tw_label(key, r) if mkt == "TW" else key
            vals = [mkt, label, len(r["names"]), r["spend_day"], r["value_day"], None,
                    r["spend_win"], r["value_win"], None, r["budget"], None, None]
            for col, v in enumerate(vals, 1):
                cell = ws.cell(row=row, column=col, value=v)
                cell.border = box
            ws.cell(row=row, column=6, value=f'=IFERROR(E{row}/D{row},"-")')
            ws.cell(row=row, column=9, value=f'=IFERROR(H{row}/G{row},"-")')
            for col in (4, 5, 7, 8, 10):
                ws.cell(row=row, column=col).number_format = money
            for col in (6, 9):
                ws.cell(row=row, column=col).number_format = roas
            row += 1
        last = row - 1

        ws.cell(row=row, column=1, value=mkt)
        ws.cell(row=row, column=2, value=f"{title} 小計（分列）")
        for col in (3, 4, 5, 7, 8, 10):
            L = get_column_letter(col)
            ws.cell(row=row, column=col, value=f"=SUM({L}{first}:{L}{last})" if last >= first else 0)
            ws.cell(row=row, column=col).number_format = money
        ws.cell(row=row, column=6, value=f'=IFERROR(E{row}/D{row},"-")').number_format = roas
        ws.cell(row=row, column=9, value=f'=IFERROR(H{row}/G{row},"-")').number_format = roas
        for col in range(1, 13):
            ws.cell(row=row, column=col).fill = sub_fill
            ws.cell(row=row, column=col).font = bold
            ws.cell(row=row, column=col).border = box
        recon.append((mkt, title, row, other, acct, fx))
        row += 2

    # 對帳行：分列花費加總＋略過（其他）＝帳戶層級 insights 總花費
    ws.cell(row=row, column=1, value="對帳").font = Font(bold=True, size=12)
    row += 1
    rh = ["市場", "項目", "", "當日花費", "", "", f"近{win_h}小時花費"]
    for col, h in enumerate(rh, 1):
        c = ws.cell(row=row, column=col, value=h or None)
        c.font = bold
        c.fill = rec_fill
        c.border = box
    row += 1
    tot_rows = {"day": [], "win": []}
    for mkt, title, sub_row, other, acct, fx in recon:
        od = other["spend_day"] if other else 0.0
        ow = other["spend_win"] if other else 0.0
        items = [
            ("分列花費加總", f"=D{sub_row}", f"=G{sub_row}"),
            ("略過（判不出系列，不出列）", od, ow),
            ("帳戶總花費（帳戶層級 insights）", num(acct.get("total_spend_day")) * fx,
             num(acct.get("total_spend_win")) * fx),
        ]
        start = row
        for name, dv, wv in items:
            ws.cell(row=row, column=1, value=mkt)
            ws.cell(row=row, column=2, value=f"{title}：{name}")
            ws.cell(row=row, column=4, value=dv).number_format = money
            ws.cell(row=row, column=7, value=wv).number_format = money
            row += 1
        ws.cell(row=row, column=1, value=mkt)
        ws.cell(row=row, column=2, value=f"{title}：差額（分列＋略過−帳戶總額）").font = bold
        ws.cell(row=row, column=4, value=f"=D{start}+D{start+1}-D{start+2}").number_format = money
        ws.cell(row=row, column=7, value=f"=G{start}+G{start+1}-G{start+2}").number_format = money
        tot_rows["day"].append(start + 2)
        tot_rows["win"].append(start + 2)
        row += 1
        if other and other["campaigns"]:
            notes.append(f"{title} 略過的花費來自：{'、'.join(sorted(other['campaigns']))}"
                         f"（近{win_h}小時 {other['spend_win']:,.0f}，原日預算 {other['budget']:,.0f} 未列入上表）")
    ws.cell(row=row, column=2, value="三帳戶總花費（台幣）").font = bold
    ws.cell(row=row, column=4, value="=" + "+".join(f"D{r}" for r in tot_rows["day"])).number_format = money
    ws.cell(row=row, column=7, value="=" + "+".join(f"G{r}" for r in tot_rows["win"])).number_format = money
    row += 2

    notes = [
        f"資料來源：Meta 廣告管理員（{data.get('source', 'Meta MCP')}），撈取時間 {data.get('fetched_at', '未填')}。",
        f"在線素材數與原日預算是撈取當下的狀態（{data.get('fetched_at', '未填')}），不是 {cutoff:02d}:00 整點快照。",
        "實銷、備註留空，請從線上戰情台或 WooCommerce 後台填入。",
    ] + notes + data.get("extra_notes", [])
    ws.cell(row=row, column=1, value="註記").font = bold
    row += 1
    for n in notes:
        ws.cell(row=row, column=1, value=f"・{n}").font = Font(size=9, color="4B5563")
        row += 1

    # 明細頁：每支廣告歸到哪一列、為什麼，方便對帳
    ds = wb.create_sheet("明細")
    dh = ["市場", "歸列", "判定依據", "活動", "組合", "廣告", "effective_status",
          "當日花費(台幣)", "當日轉換金額(台幣)", f"近{win_h}h花費(台幣)", f"近{win_h}h轉換金額(台幣)"]
    for col, h in enumerate(dh, 1):
        c = ds.cell(row=1, column=col, value=h)
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = hdr_fill
    for i, w in enumerate([6, 34, 16, 40, 34, 44, 14, 14, 16, 14, 16], 1):
        ds.column_dimensions[get_column_letter(i)].width = w
    for i, (mkt, key, why, ad) in enumerate(all_detail, 2):
        fx = FX[data["accounts"][mkt]["currency"]]
        vals = [mkt, key, why, ad["campaign_name"], ad.get("adset_name"), ad["ad_name"],
                ad.get("effective_status"), num(ad.get("spend_day")) * fx, num(ad.get("value_day")) * fx,
                num(ad.get("spend_win")) * fx, num(ad.get("value_win")) * fx]
        for col, v in enumerate(vals, 1):
            c = ds.cell(row=i, column=col, value=v)
            if col >= 8:
                c.number_format = money
    ds.freeze_panes = "A2"
    ds.auto_filter.ref = f"A1:K{len(all_detail) + 1}"

    wb.save(out)

    # 終端對帳行（同 warroom.py 每次跑完印的那行）
    for mkt, title, sub_row, other, acct, fx in recon:
        rows, oth, _, _ = build_rows(mkt, acct, fx, win_h, data.get("budget_in_major_units", False))
        s_day = sum(r["spend_day"] for r in rows.values())
        s_win = sum(r["spend_win"] for r in rows.values())
        o_day = oth["spend_day"] if oth else 0.0
        o_win = oth["spend_win"] if oth else 0.0
        t_day = num(acct.get("total_spend_day")) * fx
        t_win = num(acct.get("total_spend_win")) * fx
        print(f"[對帳] {mkt} 當日 分列 {s_day:,.0f} + 略過 {o_day:,.0f} vs 帳戶 {t_day:,.0f}"
              f"（差 {s_day + o_day - t_day:+,.0f}）｜近{win_h}h 分列 {s_win:,.0f} + 略過 {o_win:,.0f}"
              f" vs 帳戶 {t_win:,.0f}（差 {s_win + o_win - t_win:+,.0f}）")
    print(f"已輸出 {out}")


if __name__ == "__main__":
    sys.exit(main())
