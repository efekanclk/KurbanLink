import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import './LegalPage.css';

const KvkkPage = () => {
    return (
        <div className="legal-page">
            <SEO
                title="KVKK Aydınlatma Metni | KurbanLink"
                description="6698 Sayılı Kişisel Verilerin Korunması Kanunu kapsamında KurbanLink aydınlatma metni."
                url="https://kurbanlink.com/kvkk"
            />
            <div className="legal-container">
                <div className="legal-breadcrumb">
                    <Link to="/">Ana Sayfa</Link> › KVKK Aydınlatma Metni
                </div>

                <h1>6698 Sayılı KVKK Kapsamında Aydınlatma Metni</h1>

                <section>
                    <h2>1. Veri Sorumlusu</h2>
                    <p>
                        6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, <strong>KurbanLink</strong> olarak, kişisel verilerinizi aşağıda açıklanan kapsamda ve mevzuat tarafından emredilen sınırlar çerçevesinde işlemekteyiz.
                    </p>
                </section>

                <section>
                    <h2>2. Kişisel Verilerin İşlenme Amacı</h2>
                    <p>KurbanLink platformu üzerinden sunulan hizmetlerin (ilan verme, kurbanlık arama, nakliye ve kasap hizmetlerine erişim) ifası amacıyla;</p>
                    <ul>
                        <li>Kullanıcı hesaplarının oluşturulması ve doğrulanması,</li>
                        <li>İlanların platform üzerinde yayınlanması ve yönetilmesi,</li>
                        <li>Alıcı ve satıcı arasındaki iletişimin kolaylaştırılması,</li>
                        <li>Platform güvenliğinin sağlanması ve suistimallerin önlenmesi</li>
                    </ul>
                    <p>amaçlarıyla adınız, soyadınız, telefon numaranız, e-posta adresiniz ve konum bilgileriniz işlenmektedir.</p>
                </section>

                <section>
                    <h2>3. Kişisel Verilerin Aktarılması</h2>
                    <p>İşlenen kişisel verileriniz;</p>
                    <ul>
                        <li>İlan yayınlama sürecinde, ilan detaylarında yer alan iletişim bilgileriniz (telefon vb.) diğer kullanıcıların size ulaşabilmesi adına kamuya açık hale getirilmektedir.</li>
                        <li>Yasal yükümlülüklerimizin yerine getirilmesi amacıyla, yetkili kamu kurum ve kuruluşları ile adli makamlardan gelen talepler doğrultusunda ilgili mercilerle paylaşılabilir.</li>
                        <li>Verileriniz, platformun teknik altyapısını sağlayan güvenli sunucularda (AWS vb.) saklanmaktadır.</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
                    <p>
                        Kişisel verileriniz, platforma üye olduğunuzda veya ilan oluşturduğunuzda tamamen dijital ortamda, kullanıcı beyanına dayalı olarak toplanmaktadır. Bu süreç, <em>"bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması"</em> ve <em>"veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi"</em> hukuki sebeplerine dayanmaktadır.
                    </p>
                </section>

                <section>
                    <h2>5. Veri Sahibinin Hakları</h2>
                    <p>
                        KVKK'nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, verilerin silinmesini veya düzeltilmesini isteme haklarına sahipsiniz. Taleplerinizi <a href="mailto:info@kurbanlink.com">info@kurbanlink.com</a> üzerinden bize iletebilirsiniz.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default KvkkPage;
