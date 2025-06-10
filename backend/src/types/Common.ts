/**
 * Common types used across the application
 * 
 * These base types provide consistency for database documents, API responses,
 * and shared data structures throughout the hiking planner application.
 */

/**
 * Base interface for all documents stored in the database
 * 
 * All entities in the system extend this interface to ensure consistent
 * identification and tracking of creation/modification times.
 * 
 * @example
 * ```typescript
 * interface UserProfile extends BaseDocument {
 *   email: string;
 *   name: string;
 * }
 * ```
 */
export interface BaseDocument {
  /** Unique identifier for the document */
  id: string;
  /** Cosmos DB partition key for efficient querying and scaling */
  partitionKey: string;
  /** Timestamp when the document was first created */
  createdAt: Date;
  /** Timestamp when the document was last modified */
  updatedAt: Date;
}

/**
 * Geographic coordinate point using WGS84 standard
 * 
 * Represents a precise location on Earth using longitude and latitude.
 * Used throughout the application for trail locations, user locations,
 * and search coordinates.
 * 
 * @example
 * ```typescript
 * const trailStart: Coordinates = {
 *   longitude: -122.4194,  // San Francisco longitude
 *   latitude: 37.7749      // San Francisco latitude
 * };
 * ```
 */
export interface Coordinates {
  /** East-west position (-180 to 180 degrees) */
  longitude: number;
  /** North-south position (-90 to 90 degrees) */
  latitude: number;
}

/**
 * Basic location information with regional context
 * 
 * Provides geographical context for entities like trails and trips.
 * The region field helps categorize locations for search and filtering.
 */
export interface Location {
  /** Geographic region name (e.g., "Pacific Northwest", "Rocky Mountains") */
  region: string;
  /** Precise coordinates of the location */
  coordinates: Coordinates;
}

/**
 * Extended location with detailed address information
 * 
 * Inherits from Location and adds specific geographic details.
 * Used for user profiles and detailed trail information where
 * precise address data is available.
 * 
 * @example
 * ```typescript
 * const userLocation: GeoLocation = {
 *   region: "Pacific Northwest",
 *   coordinates: { longitude: -122.4194, latitude: 37.7749 },
 *   city: "San Francisco",
 *   state: "California", 
 *   country: "United States",
 *   address: "123 Market Street"
 * };
 * ```
 */
export interface GeoLocation extends Location {
  /** City name */
  city: string;
  /** State or province name */
  state: string;
  /** Country name */
  country: string;
  /** Optional street address for precise location */
  address?: string;
}

/**
 * Date range specification for trips and availability
 * 
 * Defines a time period with optional flexibility for trip planning.
 * The flexibility field allows for alternative dates around the main range.
 * 
 * @example
 * ```typescript
 * const tripDates: DateRange = {
 *   startDate: new Date('2024-07-01'),
 *   endDate: new Date('2024-07-07'),
 *   flexibility: 3  // Can move dates by up to 3 days
 * };
 * ```
 */
export interface DateRange {
  /** Start date of the range */
  startDate: Date;
  /** End date of the range */
  endDate: Date;
  /** Optional number of days the dates can be adjusted */
  flexibility?: number; // days of flexibility
}

/**
 * Numeric range with minimum and maximum values
 * 
 * Used for various numeric constraints like distance, duration,
 * elevation gain, and other measurable attributes in search filters
 * and preferences.
 * 
 * @example
 * ```typescript
 * const hikingDistance: Range = {
 *   min: 5,   // minimum 5 km
 *   max: 15   // maximum 15 km
 * };
 * ```
 */
export interface Range {
  /** Minimum value (inclusive) */
  min: number;
  /** Maximum value (inclusive) */
  max: number;
}

/**
 * Budget specification for trip planning
 * 
 * Defines monetary constraints for hiking trips, including currency
 * and accommodation preferences. Used in trip planning and recommendation
 * algorithms to suggest appropriate options.
 * 
 * @example
 * ```typescript
 * const tripBudget: Budget = {
 *   amount: 500,
 *   currency: "USD",
 *   includesAccommodation: false  // Budget is for activities only
 * };
 * ```
 */
export interface Budget {
  /** Budget amount in the specified currency */
  amount: number;
  /** ISO 4217 currency code (e.g., "USD", "EUR", "CAD") */
  currency: string;
  /** Whether accommodation costs are included in the amount */
  includesAccommodation: boolean;
}

/**
 * Pagination and query types
 * 
 * These interfaces provide consistent pagination and sorting across all API endpoints.
 * They support both offset-based and page-based pagination patterns.
 */

/**
 * Pagination options for API requests
 * 
 * Supports both page-based and offset-based pagination. Use page/limit
 * for simple pagination or offset/limit for more precise control.
 * 
 * @example
 * ```typescript
 * // Page-based pagination
 * const pageOptions: PaginationOptions = {
 *   page: 2,
 *   limit: 20
 * };
 * 
 * // Offset-based pagination  
 * const offsetOptions: PaginationOptions = {
 *   offset: 40,
 *   limit: 20
 * };
 * ```
 */
export interface PaginationOptions {
  /** Page number (1-based) for page-based pagination */
  page?: number;
  /** Maximum number of items to return */
  limit?: number;
  /** Number of items to skip for offset-based pagination */
  offset?: number;
}

/**
 * Extended query options with sorting capabilities
 * 
 * Inherits pagination options and adds sorting functionality.
 * Used in search and list endpoints where data ordering is important.
 * 
 * @example
 * ```typescript
 * const queryOptions: QueryOptions = {
 *   page: 1,
 *   limit: 10,
 *   sortBy: "createdAt",
 *   sortOrder: "desc"
 * };
 * ```
 */
export interface QueryOptions extends PaginationOptions {
  /** Field name to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Standard API response wrapper
 * 
 * Provides consistent response format across all API endpoints.
 * The generic type T allows for type-safe response data while
 * maintaining standard error and success indicators.
 * 
 * @template T The type of data being returned
 * 
 * @example
 * ```typescript
 * // Success response
 * const response: ApiResponse<Trail[]> = {
 *   success: true,
 *   data: [trail1, trail2],
 *   message: "Trails retrieved successfully"
 * };
 * 
 * // Error response
 * const errorResponse: ApiResponse<null> = {
 *   success: false,
 *   data: null,
 *   error: "Trail not found"
 * };
 * ```
 */
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  /** The response payload data */
  data: T;
  /** Optional success message */
  message?: string;
  /** Optional error message when success is false */
  error?: string;
}

/**
 * Paginated response wrapper for list endpoints
 * 
 * Extends the concept of API responses to include pagination metadata.
 * Used for endpoints that return lists of items with pagination support.
 * 
 * @template T The type of items in the paginated list
 * 
 * @example
 * ```typescript
 * const response: PaginatedResponse<Trail> = {
 *   items: [trail1, trail2, trail3],
 *   total: 150,
 *   page: 2,
 *   limit: 20,
 *   hasNext: true,
 *   hasPrevious: true
 * };
 * ```
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Total number of items available across all pages */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Whether there are more pages after this one */
  hasNext: boolean;
  /** Whether there are pages before this one */
  hasPrevious: boolean;
}