import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import './LegalPage.css';

const GizlilikPage = () => {
    return (
        <div className="legal-page">
            <SEO
                title="Gizlilik Politikası | KurbanLink"
                description="KurbanLink gizlilik ve kullanım sözleşmesi. Veri güvenliği, çerez politikası ve kullanım koşulları."
                url="https://kurbanlink.com/gizlilik"
            />
            <div className="legal-container">
                <div className="legal-breadcrumb">
                    <Link to="/">Ana Sayfa</Link> › Gizlilik Politikası
                </div>

                <h1>Gizlilik ve Kullanım Sözleşmesi</h1>

                <section>
                    <h2>1. Giriş ve Kapsam</h2>
                    <p>
                        Bu sözleşme, <strong>KurbanLink</strong> web sitesi ve mobil arayüzü üzerinden sunulan hizmetlerin kullanımına ilişkin gizlilik kurallarını ve tarafların sorumluluklarını belirler. Siteye üye olan her kullanıcı, bu sözleşme hükümlerini kabul etmiş sayılır.
                    </p>
                </section>

                <section>
                    <h2>2. Bilgi Güvenliği</h2>
                    <ul>
                        <li>
                            <strong>Şifreleme:</strong> Kullanıcı şifreleri, sistem üzerinde geri döndürülemez bir şekilde şifrelenmiş (hashing) olarak saklanır. KurbanLink yöneticileri dahil hiç kimse kullanıcı şifrelerine erişemez.
                        </li>
                        <li>
                            <strong>Hesap Güvenliği:</strong> Kullanıcı, hesap bilgilerinin gizliliğinden ve güvenliğinden bizzat sorumludur. Hesabın üçüncü şahıslar tarafından kullanılmasından doğacak zararlardan KurbanLink sorumlu tutulamaz.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2>3. Çerez (Cookie) Politikası</h2>
                    <p>
                        KurbanLink, kullanıcı deneyimini iyileştirmek, oturum yönetimini sağlamak ve tercihlerinizi hatırlamak amacıyla çerezler kullanmaktadır. Tarayıcı ayarlarınızdan çerezleri reddedebilirsiniz; ancak bu durumda platformun bazı özellikleri tam çalışmayabilir.
                    </p>
                </section>

                <section>
                    <h2>4. İlan İçerikleri ve Üçüncü Taraflar</h2>
                    <ul>
                        <li>Platform, kullanıcılar tarafından yüklenen içeriklerin (fotoğraf, açıklama, fiyat) doğruluğunu garanti etmez. İlanlardaki bilgilerden ilan sahibi sorumludur.</li>
                        <li>Sitede yer alan üçüncü taraf bağlantıları (kasap veya nakliye ilanlarındaki dış linkler) üzerinden gidilen sitelerin gizlilik politikalarından KurbanLink sorumlu değildir.</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Hizmet Değişiklikleri</h2>
                    <p>
                        KurbanLink, gizlilik şartlarında ve platformun işleyişinde tek taraflı değişiklik yapma hakkını saklı tutar. Güncel sözleşme her zaman bu sayfada yayınlanacaktır.
                    </p>
                </section>

                <div className="legal-footer-note">
                    <p>Sorularınız için: <a href="mailto:destek@kurbanlink.com">destek@kurbanlink.com</a></p>
                    <Link to="/kvkk" className="legal-link">KVKK Aydınlatma Metnini inceleyin →</Link>
                </div>
            </div>
        </div>
    );
};

export default GizlilikPage;
