FROM rabbitmq

# Define environment variables.
ENV RABBITMQ_USER ravi
ENV RABBITMQ_PASSWORD ravi
ENV RABBITMQ_PID_FILE /var/lib/rabbitmq/mnesia/rabbitmq
ENV VIRTUAL_HOST rideshare
ADD init.sh /init.sh
RUN chmod +x /init.sh
EXPOSE 15672

# Define default command
CMD ["/init.sh"]
