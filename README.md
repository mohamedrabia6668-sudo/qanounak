# موقع قانونك: دليل التشغيل مع الشات وتسجيل الدخول

الملفات:
- `index.html` الموقع الرئيسي (فيه زر «الاستشارة المباشرة» يفتح الشات)
- `chat.html` تسجيل الدخول وإنشاء الحساب والشات (للزائر) ولوحة الرد (للمستشار)
- `firestore.rules` قواعد الأمان الخاصة بقاعدة البيانات

## 1) إنشاء مشروع Firebase
1. ادخل https://console.firebase.google.com وأنشئ مشروعاً جديداً (Add project).
2. من القائمة: Build > Authentication > Get started > Sign-in method > فعّل **Email/Password**.
3. من القائمة: Build > Firestore Database > Create database > اختر Production mode واختر أقرب منطقة.
4. من تبويب **Rules** في Firestore: امسح المحتوى والصق محتوى ملف `firestore.rules` ثم Publish.

## 2) ربط الشات بمشروعك
1. Project settings (أيقونة الترس) > Your apps > اختر أيقونة الويب `</>` وسجّل التطبيق.
2. انسخ قيم `firebaseConfig` وضعها في `chat.html` مكان القيم التي تبدأ بـ PASTE داخل `const cfg={...}`.
3. من Authentication > Settings > Authorized domains: أضف دومين موقعك إن لم يكن موجوداً (دومين Firebase Hosting يُضاف تلقائياً).

## 3) جعل حسابك حساب المستشار
1. افتح الموقع، ادخل صفحة الشات، وأنشئ حساباً بإيميلك (واستخدم كلمة مرور قوية).
2. في Firebase: Authentication > Users، وانسخ قيمة **User UID** لحسابك.
3. في Firestore Database: Start collection باسم `admins`، واجعل Document ID هو الـ UID الذي نسخته، وأضف أي حقل (مثلاً `active` = true).
4. سجّل خروج ثم دخولاً من جديد: ستظهر لك «لوحة المستشار» بقائمة كل المحادثات للرد عليها.

## 4) النشر
الأسهل Firebase Hosting:
```
npm install -g firebase-tools
firebase login
firebase init hosting     # اختر مشروعك، والمجلد العام هو مجلد الملفات هذه، ولا تعمل overwrite لـ index.html
firebase deploy
```
أو ارفع المجلد كاملاً على Netlify (Drag and drop) أو أي استضافة ملفات ثابتة.

## ملاحظات
- الخطة المجانية (Spark) تكفي للبداية.
- لا يوجد إشعار تلقائي للمستشار برسالة جديدة، فافتح اللوحة دورياً. الإشعارات تحتاج Cloud Functions أو FCM وهي إضافة لاحقة.
- المحادثات تُخزَّن في حسابك على Firebase، فراجع خصوصية بيانات الزوار والتزاماتك القانونية تجاهها.
- لو أردت منع التسجيل بإيميلات وهمية فعّل التحقق من البريد (Email verification) لاحقاً.
