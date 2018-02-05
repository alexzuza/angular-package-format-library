import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'zuz-input',
    templateUrl: './input.component.html'
})
export class ZuzInputComponent implements OnInit {
    @Input() cssClass: string;

    constructor() { }

    ngOnInit() { }
}
