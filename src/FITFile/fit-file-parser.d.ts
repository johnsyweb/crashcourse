declare module 'fit-file-parser' {
  interface FitParserOptions {
    force?: boolean;
    speedUnit?: 'm/s' | 'km/h' | 'mph';
    lengthUnit?: 'm' | 'km' | 'mi';
    temperatureUnit?: 'celsius' | 'fahrenheit' | 'kelvin';
    pressureUnit?: 'bar' | 'cbar' | 'psi';
    elapsedRecordField?: boolean;
    mode?: 'list' | 'both' | 'cascade';
  }

  interface FitRecord {
    position_lat?: number;
    position_long?: number;
    altitude?: number;
    timestamp?: Date | string | number;
    [key: string]: unknown;
  }

  interface FitActivity {
    sport?: string;
    [key: string]: unknown;
  }

  interface FitSession {
    sport?: string;
    [key: string]: unknown;
  }

  export interface FitParsedData {
    records?: FitRecord[];
    activity?: FitActivity;
    sessions?: FitSession[];
    [key: string]: unknown;
  }

  class FitParser {
    constructor(options?: FitParserOptions);
    parse(
      buffer: ArrayBuffer | Uint8Array,
      callback: (error: string | null, data?: FitParsedData) => void
    ): void;
  }

  export default FitParser;
}
