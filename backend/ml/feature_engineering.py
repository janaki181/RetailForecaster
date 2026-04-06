from datetime import date
import pandas as pd


def is_festive_period(d: date) -> int:
    # Simple retail festive calendar approximation.
    if (d.month == 10 and d.day >= 15) or (d.month == 11 and d.day <= 15):
        return 1
    if (d.month == 12 and d.day >= 15) or (d.month == 1 and d.day <= 5):
        return 1
    if d.month == 3 and d.day >= 20:
        return 1
    return 0


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    out = df.copy()
    out["sale_day"] = pd.to_datetime(out["sale_date"]).dt.date
    out = out.sort_values("sale_day")
    out["day_of_week"] = pd.to_datetime(out["sale_day"]).dt.dayofweek
    out["day_of_month"] = pd.to_datetime(out["sale_day"]).dt.day
    out["month"] = pd.to_datetime(out["sale_day"]).dt.month
    out["is_weekend"] = out["day_of_week"].isin([5, 6]).astype(int)
    out["is_festive_period"] = out["sale_day"].apply(is_festive_period)
    out["lag_7"] = out["qty"].shift(7).fillna(0)
    out["lag_14"] = out["qty"].shift(14).fillna(0)
    out["lag_30"] = out["qty"].shift(30).fillna(0)
    out["rolling_mean_7"] = out["qty"].rolling(7, min_periods=1).mean()
    out["rolling_mean_14"] = out["qty"].rolling(14, min_periods=1).mean()
    out["rolling_mean_30"] = out["qty"].rolling(30, min_periods=1).mean()
    return out
