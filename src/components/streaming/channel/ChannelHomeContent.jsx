import SponsorEditor from '../creator/SponsorEditor';
import SponsorsSection from '../profile/SponsorsSection';
import ProductsGrid from '../profile/ProductsGrid';
import ViewerSeasonalPass from '../ViewerSeasonalPass';
import './channelCommerce.css';

// The channel homepage keeps its original sponsor, shop/event and season-pass modules.
export default function ChannelHomeContent({ sponsors = [], isEditMode = false, allowEditing = false, onAddSponsor, onRemoveSponsor, onUpdateSponsor }) {
  return <div className="channel-commerce">
    <section className="channel-commerce-section channel-sponsors-section" aria-label="Channel sponsors and information">
      {isEditMode || sponsors.length > 0 ? <SponsorEditor isEditMode={isEditMode} sponsors={sponsors} onAdd={onAddSponsor} onRemove={onRemoveSponsor} onUpdate={onUpdateSponsor} compact /> : <SponsorsSection allowEditing={allowEditing} compact />}
    </section>
    <section className="channel-commerce-section" aria-label="Channel products and events">
      <ProductsGrid allowEditing={allowEditing} compact />
    </section>
    <section className="channel-commerce-section" aria-label="Channel season pass">
      <ViewerSeasonalPass currentTier={12} maxTier={20} compact />
    </section>
  </div>;
}
