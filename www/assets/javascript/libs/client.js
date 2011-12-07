var client = {
  getScreen: function() {
    this.window = {
      width:    $(window).width(),
      height:   $(window).height()
    }
    this.document = {
      width:    $(document).width(),
      height:   $(document).height()
    }    
    this.resolution = window.devicePixelRatio ? window.devicePixelRatio : 1;
    this.ratio = 1024 / this.window.width;
    this.retina = this.resolution >= 2;

    if(this.iosMobile) {
      if(this.iphone || this.ipod) this.screen = "iphone";
      else if(this.ipad) this.screen = "ipad";
    } else {
      this.screen = "full";
    }
  },

  getBrowserInfos: function() {
    this.userAgent = navigator.userAgent.toLowerCase();

    this.testMobile();
    this.testWebkit();
  },

  testAndroid: function() { this.android = this.android !== undefined ? this.android : this.userAgent.indexOf("android") > -1; return this.android; },
  
  testIOSMobile: function() { this.iosMobile = this.iosMobile !== undefined ? this.iosMobile : (this.testIPod() || this.testIPad() || this.testIPhone()); return this.iosMobile; },
  testIPod: function() { this.ipod = this.ipod !== undefined ? this.ipod : this.userAgent.indexOf("ipod") > -1; return this.ipod; },
  testIPad: function() { this.ipad = this.ipad !== undefined ? this.ipad : this.userAgent.indexOf("ipad") > -1; return this.ipad; },
  testIPhone: function() { this.iphone = this.iphone !== undefined ? this.iphone : this.userAgent.indexOf("iphone") > -1; return this.iphone; },

  testMobile: function() { this.mobile = this.mobile !== undefined ? this.mobile : (this.testAndroid() || this.testIOSMobile()); return this.mobile; },

  testWebkit: function() { this.webkit = this.webkit !== undefined ? this.webkit : this.userAgent.indexOf("webkit") > -1; return this.webkit; }
};

client.getBrowserInfos();