cd api
cp .env.example .env
composer install
php artisan key:generate
php artisan storage:link
php artisan serve




!!! Não correr php artisan migrate nem php artisan migrate --seed !!!
A base de dados já vem pronta.




cd frontend
cp .env.example .env
npm install
npm run dev




Para correr testes unitários
Abrir outro terminal frontend
npm test