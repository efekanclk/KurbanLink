# KurbanLink 🐄🐑

**KurbanLink**, kurbanlık hayvan alım–satım süreçlerini dijitalleştirmeyi amaçlayan,  
yapay zekâ destekli bir web platformudur. Proje; alıcıları, satıcıları ve kasapları
tek bir sistem altında buluşturarak Kurban Bayramı döneminde yaşanan
zaman, güven ve organizasyon problemlerine çözüm sunmayı hedefler.

Bu proje, **TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri Destek Programı**
kapsamında geliştirilmektedir.

---

## 🎯 Projenin Amacı

KurbanLink'in temel amacı:

- Kurbanlık hayvan alım–satım süreçlerini daha **hızlı, güvenli ve şeffaf** hale getirmek  
- Kullanıcılara **kişiselleştirilmiş öneriler** sunarak doğru hayvana daha kısa sürede ulaşmalarını sağlamak  
- Kurban ortaklığı ve kasap kiralama gibi hizmetleri tek platformda toplamak  
- Küçük ölçekli satıcıların daha geniş kitlelere ulaşmasını sağlamak  

---

## 🚀 Kurulum ve Çalıştırma

### Ön Gereksinimler

Projeyi çalıştırabilmek için aşağıdaki yazılımların sisteminizde kurulu olması gerekmektedir:

- **Python 3.8+** (Backend için)
- **Node.js 16+** ve **npm** (Frontend için)
- **Git** (Projeyi klonlamak için)

### 1. Projeyi Klonlama

```bash
git clone https://github.com/kullanici-adi/KurbanLink.git
cd KurbanLink
```

### 2. Backend Kurulumu

```bash
# Backend dizinine geç
cd backend

# Python sanal ortamı oluştur (isteğe bağlı ama önerilir)
python3 -m venv venv

# Sanal ortamı aktif et
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Gerekli Python paketlerini yükle
pip install -r requirements.txt

# Veritabanı migration'larını uygula
python manage.py migrate

# Süper kullanıcı oluştur (admin paneli için)
python manage.py createsuperuser

# Backend sunucusunu başlat
python manage.py runserver
```

Backend sunucusu `http://localhost:8000` adresinde çalışacaktır.

### 3. Frontend Kurulumu

Yeni bir terminal penceresi açın:

```bash
# Ana dizinden frontend dizinine geç
cd frontend

# NPM paketlerini yükle
npm install

# Frontend development sunucusunu başlat
npm run dev
```

Frontend sunucusu `http://localhost:5173` adresinde çalışacaktır.

### 4. Uygulamayı Kullanma

- **Frontend:** Tarayıcınızda `http://localhost:5173` adresine gidin
- **Backend API:** `http://localhost:8000/api/` 
- **Admin Panel:** `http://localhost:8000/admin/` (superuser bilgilerinizle giriş yapın)

---

## 📁 Proje Yapısı

```
KurbanLink/
├── backend/          # Django REST Framework backend
│   ├── apps/         # Django uygulamaları
│   ├── core/         # Ana proje ayarları
│   ├── media/        # Yüklenen dosyalar
│   └── manage.py     # Django yönetim scripti
├── frontend/         # React + Vite frontend
│   ├── src/          # Kaynak kodlar
│   ├── public/       # Statik dosyalar
│   └── package.json  # NPM bağımlılıkları
└── README.md         # Bu dosya
```

---

## 🛠️ Teknolojiler

### Backend
- Django 4.2 (LTS)
- Django REST Framework
- Simple JWT (Token tabanlı kimlik doğrulama)
- Pillow (Görsel işleme)
- SQLite (Development) / PostgreSQL (Production)

### Frontend
- React 19
- React Router DOM
- Vite (Build tool)
- Axios (HTTP client)
- Lucide React (İkonlar)

---

## 🔧 Geliştirme

### Backend Development

```bash
cd backend

# Migration oluşturma
python manage.py makemigrations

# Migration uygulama
python manage.py migrate

# Test çalıştırma
python manage.py test

# Statik dosyaları toplama (production için)
python manage.py collectstatic
```

### Frontend Development

```bash
cd frontend

# Development sunucusu
npm run dev

# Production build
npm run build

# Production build'i önizleme
npm run preview
```

---

## 📌 Notlar

- Proje akademik amaçlı geliştirilmekte olup ticari bir ürün değildir.
- Ödeme işlemleri sistem üzerinden yapılmamaktadır.
- Kasap hizmetleri kullanıcı ve kasap arasında yüz yüze yürütülmektedir.
- Development ortamında SQLite kullanılmaktadır. Production için PostgreSQL önerilir.

---

## 🐛 Sorun Giderme

### Port çakışması durumunda:

**Backend için:**
```bash
python manage.py runserver 8001  # Farklı bir port kullan
```

**Frontend için:**
```bash
npm run dev -- --port 5174  # package.json scripts'inde port değiştir
```

### Migration hataları:

```bash
# Tüm migration'ları sıfırla (dikkatli kullanın!)
python manage.py migrate --run-syncdb
```

### NPM paket hataları:

```bash
# node_modules ve package-lock.json'u sil, tekrar yükle
rm -rf node_modules package-lock.json
npm install
```

---

## 📄 Lisans

Bu proje akademik kullanım amaçlıdır.
