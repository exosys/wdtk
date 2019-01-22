import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

@Component({
    selector: '<%= prefix %>-root',<% if(inlineTemplate) { %>
    template: `<ion-app>
                <ion-router-outlet></ion-router-outlet>
             </ion-app> `,<% } else { %>
    templateUrl: './app.component.html',<% }  %>
})
export class AppComponent {
    title =  '<%= name %>';
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}
