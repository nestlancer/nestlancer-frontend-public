import { FeaturedWorkSlider } from './FeaturedWorkSlider';
import { loadFeaturedWork } from '../../lib/load-featured-work';

/** Isolated async island so homepage shell is not blocked on portfolio API. */
export async function FeaturedWorkSection() {
  const featuredWork = await loadFeaturedWork(8);
  return <FeaturedWorkSlider items={featuredWork} />;
}
