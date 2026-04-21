<?php
/**
 * This file holds the class FetchIndicators.
 *
 * @since      1.0.0
 * @package    ASCSelfAssessment
 * @subpackage ASCSelfAssessment/includes
 */

/**
 * This class makes the request to the server and pull the data
 */
class FetchRequiredData {
	/**
	 * The endpoint for the api_call to the remote MongoDB server.
	 *
	 * @var string
	 */
	const MONGO_ENDPOINT = 'https://data.asc-aqua.org/datainterface/';


	/**
	 * This function creates the headers for the api_call.
	 *
	 * @param string $mongo_apikey The API key to use for the requests to the remote server.
	 *
	 * @return array
	 */
	private function create_headers( $mongo_apikey ) {
		$headers = array(
			'Content-Type'                   => 'application/json',
			'Access-Control-Request-Headers' => '*',
			'api-key'                        => $mongo_apikey,
		);

		return $headers;
	}

	/**
	 * This function creates the postfields for the api_call. Postfields works like a filter in MongoDB.
	 */
	private function create_postfields() {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- @see ascds_ajax_process.
		$post_data = wp_unslash( $_POST );

		if ( isset( $post_data['action'] ) ) {
			unset( $post_data['action'] );
		}
		if ( isset( $post_data['_ajax_nonce'] ) ) {
			unset( $post_data['_ajax_nonce'] );
		}
		if ( isset( $post_data['projection'] ) ) {
			$projection = array_map( 'intval', $post_data['projection'] );
			unset( $post_data['projection'] );
		}
		if ( isset( $post_data['collection'] ) ) {
			$collection = $post_data['collection'];
			unset( $post_data['collection'] );
		}
	
		$postfields = array(
			'action'     => 'find',
			'collection' => $collection,
			'database'   => 'WHITELEG',
			'dataSource' => 'WHITELEG',
			'projection' => $projection,
			'sort'       => array( 'RowID' => 1 )
		);

		if ( isset( $post_data['filter'] ) ) {
			if ( count( array_filter( $post_data['filter'] ) ) !== 0 ) {
				$postfields['filter'] = array_map( 'intval', array_filter( $post_data['filter'] ) );
			}
		}
	
		return wp_json_encode( $postfields );
	}

	/**
	 * Execute the POST in url.
	 *
	 * @param string $mongo_apikey Mongo API KEY, used to authenticate the request.
	 *
	 * @return string
	 */
	public function api_call( $mongo_apikey ) {

	// return $this->create_postfields();

		$response = wp_remote_post(
			esc_url( self::MONGO_ENDPOINT ),
			array(
				'method'      => 'POST',
				'timeout'     => 120,
				'redirection' => 10,
				'body'        => $this->create_postfields(),
				'headers'     => $this->create_headers( $mongo_apikey ),
			)
		);

		if ( is_wp_error( $response ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- @see wp_die.
			wp_die( $response->get_error_message() );
		}

		return json_decode( wp_remote_retrieve_body( $response ) );
	}
}
