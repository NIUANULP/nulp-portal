import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { global } from "@angular/compiler/src/util";

@Injectable({
  providedIn: "root",
})
export class UploadContentService {
  constructor(private httpService: HttpClient) {
    
  }

  getTheme() {
    return [
      {
        id: 1,
        name: "Town Planning & Housing",
      },
      {
        id: 2,
        name: "Urban Mobility & Housing",
      },
      {
        id: 3,
        name: "Sewerage and Sanitation",
      },
    //   {
    //     id: 4,
    //     name: "Environment and Climate",
    //   },
    //   {
    //     id: 5,
    //     name: "Social Aspects",
    //   },
    //   {
    //     id: 6,
    //     name: "Water Supply and Management",
    //   },
    //   {
    //     id: 7,
    //     name: "General Administration",
    //   },
    //   {
    //     id: 8,
    //     name: "Data Governance and Analytics",
    //   },
    //   {
    //     id: 9,
    //     name: "Urban Management & E governance",
    //   },
    //   {
    //     id: 10,
    //     name: "Municipal Finance",
    //   },
    ];
  }

  getSubTheme() {
    return [
      {
        id: 1,
        categories: [
          {
            id: 1,
            name: "Local Area Planning",
          },
          {
            id: 1,
            name: "Planning Schemes & Policies",
          },
          {
            id: 1,
            name: "Affordable Housing",
          },
          {
            id: 1,
            name: "Slums",
          },
          {
            id: 1,
            name: "Rental Housing",
          },
          {
            id: 1,
            name: "Any other relevant sub domain",
          },
        ],
      },
      {
        id: 2,
        categories: [
          {
            id: 2,
            name: "Transportation",
          },
          {
            id: 2,
            name: "Footpaths",
          },
          {
            id: 2,
            name: "Junction re-designing",
          },
          {
            id: 2,
            name: "ITMS & Smart Solutions",
          },
          {
            id: 2,
            name: "Traffic Management",
          },
          {
            id: 2,
            name: "Non motorised transport",
          },
          {
            id: 2,
            name: "Any other relevant sub domain",
          },
        ],
      },
      {
        id: 3,
        categories: [
          {
            id: 3,
            name: "Solid Waste Management",
          },
          {
            id: 3,
            name: "Liquid Waste Management",
          },
          {
            id: 3,
            name: "Waste Water Management",
          },
          {
            id: 3,
            name: "Public Toilets",
          },
          {
            id: 3,
            name: "Sewage Treatment Plants"
          },
          {
            id: 3,
            name : "Public Hygiene"
          },
          {
            id: 3,
            name: "Any other relevant sub domain"
          }
        ],
      },
    ];
  }
}
