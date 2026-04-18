FROM php:8.1-apache

# Enable mod_rewrite and allow .htaccess overrides
RUN a2enmod rewrite \
 && sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Copy backend source into document root
COPY . /var/www/html/

# Remove local .env — Render injects env vars directly
RUN rm -f /var/www/html/.env

# Set correct ownership
RUN chown -R www-data:www-data /var/www/html

# Startup script binds Apache to Render's dynamic $PORT
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
