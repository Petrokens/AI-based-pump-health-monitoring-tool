from xgboost import XGBRegressor, XGBClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, roc_auc_score

def train_xgb_regression(X_train, y_train, X_val, y_val):
    m = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.05)
    m.fit(X_train, y_train, eval_set=[(X_val,y_val)], early_stopping_rounds=20, verbose=False)
    return m

def train_xgb_classifier(X_train, y_train, X_val, y_val):
    m = XGBClassifier(n_estimators=200, max_depth=4, learning_rate=0.05, use_label_encoder=False, eval_metric='logloss')
    m.fit(X_train, y_train, eval_set=[(X_val,y_val)], early_stopping_rounds=20, verbose=False)
    return m
