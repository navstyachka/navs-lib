/**
 * Nodes root object
 *
 * Contains a few utility functions
 *
 * @copyright Nodes ApS 2010-2011 <tech@nodes.dk>
 * @author Christian Winther <cw@nodes.dk>
 * @since 08.03.2011
 */
var Nodes = {
	/**
	 * Ensure that a "namespace" exists
	 *
	 * Accepts dot notations in the parameter
	 * Accepts any number of arguments
	 *
	 */
	ns : function() {
		var o, d;
		jQuery.each(arguments, function(k, v) {
			d = v.split(".");
			o = window[d[0]] = window[d[0]] || {};
			jQuery.each(d.slice(1), function(k, v2) {
				o = o[v2] = o[v2] || {};
			});
		});
		return o;
	},

	config : function(path) {
		var o, d;

		d = path.split(".");

		if (!window.Nodes.Configuration || !window.Nodes.Configuration[d[0]]) {
			return null;
		}

		o = window.Nodes.Configuration[d[0]];
		jQuery.each(d.slice(1), function(k, v2) {
			o = o[v2] = o[v2] || null;

			if (!o) {
				return false;
			}
		});

		return o;
	},

	/**
	 * Translate a string key
	 */
	translate : function(key, params) {
		var key,
			text = Nodes.config('L10n.' + key);

		if (text === null) {
			text = key;
		} else if (typeof text !== 'string') {
			text = text.toString();
		}

		if (params) {
			for (var key in params) {
				text = text.replace('{' + key + '}', params[key]);
			}
		}

		return text;
	}

};

/**
 * Router / URL specific helper methods
 *
 * @copyright Nodes ApS 2010-2011 <tech@nodes.dk>
 * @author Christian Winther <cw@nodes.dk>
 * @since 08.03.2011
 */
Nodes.Router = {
	/**
	 * Get the absolute URL for the current application
	 *
	 * @return string
	 */
	applicationPrefix : function() {
		if (!Nodes.config('Application.slug')) {
			return null;
		}

		return '/' + Nodes.config('Application.slug');
	},

	/**
	 * Facebook Application URL - with the application id
	 *
	 * @return string
	 */
	facebookAppURL : function() {
		if (!Nodes.config('Application.app_id') || !Nodes.config('Application.fanpage')) {
			return null;
		}

		return Nodes.config('Application.fanpage') + '?sk=app_' + Nodes.config('Application.app_id');
	}
};

if (!window.__) {
	window.__ = Nodes.translate;
}
