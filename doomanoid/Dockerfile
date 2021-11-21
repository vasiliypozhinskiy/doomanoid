FROM python:3.8

WORKDIR /app

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.9.0/wait /wait
RUN chmod +x /wait

ADD . /app

ENV FLASKCV_SECRET_KEY=baihrjrjgFEgrTHhobpirejgme

RUN pip install -r requirements.txt

RUN pip install uWSGI

CMD /wait && uwsgi --http 0.0.0.0:5000 --wsgi-file main.py --callable app