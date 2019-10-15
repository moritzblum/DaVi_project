import sqlite3
import pandas as pd

def create_table_from_file(c):
    # create DB
    # Create table filtered
    c.execute('''CREATE TABLE FILTERED (
    [ID] INTEGER PRIMARY KEY,
    [OPERATOR] TEXT, 
    [LAT] REAL, 
    [LON] REAL, 
    [WHEELCHAIR] TEXT, 
    [OPENING_HOURS] TEXT, 
    [POSITION_LEVEL] INTEGER,
    [SURVEILLANCE] TEXT,
    [BRAND_WIKIDATA] TEXT,
    [EMAIL] TEXT,
    [ATM_COUNT] INTEGER,
    [DESCRIPTION] TEXT,
    [WEBSITE] TEXT)''')
    conn.commit()
    # read from csv file and put into the db
    read_atms = pd.read_csv('data/atm_filtered_transformed.csv', index_col='id')
    read_atms.to_sql('FILTERED', conn, if_exists='append')


conn = sqlite3.connect('data/atm.db')
c = conn.cursor()
create_table_from_file(c)
c.execute('''
PRAGMA table_info(FILTERED);
''')

response = c.fetchall()
print(response)







