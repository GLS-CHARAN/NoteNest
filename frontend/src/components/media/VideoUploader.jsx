import VideoIcon from '@mui/icons-material/VideoCallOutlined';
import MediaUploader from './MediaUploader.jsx';

export default function VideoUploader(props) {
  return <MediaUploader accept="video/mp4,video/webm" label="Add videos" icon={<VideoIcon />} {...props} />;
}
