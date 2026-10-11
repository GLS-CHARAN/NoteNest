import ImageIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import MediaUploader from './MediaUploader.jsx';

export default function ImageUploader(props) {
  return <MediaUploader accept="image/jpeg,image/png,image/webp" label="Add images" icon={<ImageIcon />} {...props} />;
}
