import { NgModule } from '@angular/core';

import { ZuzTestComponent } from './test.component';

export * from './test.component';

@NgModule({
  declarations: [ZuzTestComponent ],
  exports: [ZuzTestComponent]
})
export class ZuzTestModule {}
