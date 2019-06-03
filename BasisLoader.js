THREE.BasisLoader = function ( manager ) {

	THREE.CompressedTextureLoader.call( this, manager );

	this._parser = THREE.BasisLoader.parse;

};

THREE.BasisLoader.BASIS_FORMAT = {
	cTFETC1: 0,
	cTFBC1: 1,
	cTFBC4: 2,
	cTFPVRTC1_4_OPAQUE_ONLY: 3,
	cTFBC7_M6_OPAQUE_ONLY: 4,
	cTFETC2: 5,
	cTFBC3: 6,
	cTFBC5: 7,
};

THREE.BasisLoader.prototype = Object.create( THREE.CompressedTextureLoader.prototype );
THREE.BasisLoader.prototype.constructor = THREE.BasisLoader;

THREE.BasisLoader.prototype.detectSupport = function ( renderer ) {

	var context = renderer.context;

	var etcSupported = !! context.getExtension('WEBGL_compressed_texture_etc1');
	var dxtSupported = !! context.getExtension('WEBGL_compressed_texture_s3tc');
	var pvrtcSupported = !! context.getExtension('WEBGL_compressed_texture_pvrtc')
		|| !! context.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');

	if ( etcSupported ) {

		this.basisFormat = THREE.BasisLoader.BASIS_FORMAT.cTFETC1;
		this.threeFormat = THREE.RGB_ETC1_Format;

	} else if ( dxtSupported ) {

		this.basisFormat = THREE.BasisLoader.BASIS_FORMAT.cTFBC1;
		this.threeFormat = THREE.RGB_S3TC_DXT1_Format;

	} else if ( pvrtcSupported ) {

		this.basisFormat = THREE.BasisLoader.BASIS_FORMAT.cTFPVRTC1_4_OPAQUE_ONLY;
		this.threeFormat = THREE.RGB_PVRTC_4BPPV1_Format;

	} else {

		throw new Error( 'THREE.BasisLoader: No suitable compressed texture format found.' );

	}

	return this;
}

THREE.BasisLoader.parse = function ( buffer ) {

	var dds = { mipmaps: [], width: 0, height: 0, format: null, mipmapCount: 1 };

	var file = new BasisModule.BasisFile( new Uint8Array( buffer ) );

	dds.width = file.getImageWidth( 0, 0 );
	dds.height = file.getImageHeight( 0, 0 );
	dds.format = this.threeFormat;
	dds.mipmapCount = file.getNumLevels( 0 );
	dds.isCubemap = false;

	file.startTranscoding();

	for (var mip = 0; mip < dds.mipmapCount; ++mip) {

		var mipWidth = file.getImageWidth( 0, mip );
		var mipHeight = file.getImageHeight( 0, mip );

		var mipData = new Uint8Array( file.getImageTranscodedSizeInBytes( 0, mip, this.basisFormat ) );

		file.transcodeImage( mipData, 0, mip, this.basisFormat, 0, 0 );

		var mipmap = { data: mipData, width: mipWidth, height: mipHeight };
		dds.mipmaps.push( mipmap );

	}

	file.close();
	file.delete();

	return dds;

};
