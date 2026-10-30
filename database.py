import pymysql 
def get_connection():
    connection=pymysql.connect(
        host="localhost",
        user="root",
        password="Iphone13#2006",
        database="interview_db",
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection