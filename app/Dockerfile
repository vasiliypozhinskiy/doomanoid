FROM python:3.8

WORKDIR /app

ADD . /app

ENV FLASKCV_SECRET_KEY=baihrjrjgFEgrTHhobpirejgme

RUN pip install -r requirements.txt

RUN pip install uWSGI

CMD ["uwsgi", "--http", "0.0.0.0:5000", "--wsgi-file", "/app/main.py", "--callable", "app"]