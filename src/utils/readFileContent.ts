import { LatLngTuple } from 'leaflet';
import { loadGpsPoints } from './gpsLoader';

const readFileContent = (
  file: File,
  setGpsPoints: React.Dispatch<React.SetStateAction<LatLngTuple[]>>,
) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const fileContent = e.target?.result as string;
    if (!fileContent) return;

    console.debug('Raw file content:', fileContent);
    try {
      const points = loadGpsPoints(fileContent);
      console.debug('Parsed GPS Points:', points);
      setGpsPoints(points);
    } catch (error) {
      console.error('Error parsing GPS points:', error);
    }
  };
  reader.readAsText(file);
};

export default readFileContent;
