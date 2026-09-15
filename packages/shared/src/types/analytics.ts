export interface AnalyticsResponse {
  totalPageviews: number;
  byDate: { date: string; count: number }[];
  topPaths: { path: string; count: number }[];
  topReferers: { referer: string; count: number }[];
  topCountries: { country: string; count: number }[];
}
