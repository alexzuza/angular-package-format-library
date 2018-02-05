import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'zuz-input',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.css']
})
export class ZuzInputComponent implements OnInit {
    @Input() cssClass: string;

    constructor() { }

    ngOnInit() { }
}
