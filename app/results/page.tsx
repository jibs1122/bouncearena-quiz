import { buildResultsLinkIndex } from '@/lib/resultsLinks';
import ResultsClient from './ResultsClient';

// The recommendations are worked out in the browser from the URL. The link index
// is built here because comparison pages and reviews are read from disk.
export default function ResultsPage() {
  return <ResultsClient linkIndex={buildResultsLinkIndex()} />;
}
