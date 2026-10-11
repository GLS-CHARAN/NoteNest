import { useNavigate } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import EmptyState from '../components/common/EmptyState.jsx';

export default function NotFoundPage({ title = 'Page not found', description = "This page doesn't exist, or you don't have access to it." }) {
  const navigate = useNavigate();
  return <EmptyState icon={<SearchOffIcon />} title={title} description={description} actionLabel="Back to dashboard" onAction={() => navigate('/')} />;
}
