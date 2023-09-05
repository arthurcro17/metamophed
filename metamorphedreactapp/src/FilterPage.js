import React, { useEffect, useState } from "react"
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useLocation, Link } from 'react-router-dom';
import MultiSelect from 'multiselect-react-dropdown';


function FilterPage() {

    const location = useLocation()
    const [filteredBrands, setFilteredBrands] = useState(new Set())
    const [filteredCategories, setFilteredCategories] = useState(new Set())
    const [filteredVisibilities, setFilteredVisibilities] = useState([])
  
    const categories = Object.keys(location.state.categories).map(id => ({
        'id': parseInt(id),
        'name': location.state.categories[id]
    }));

    const brands = Object.keys(location.state.brands).map(id => ({
        'id': parseInt(id),
        'name': location.state.brands[id]
    }));

    function onCategoryChange(categories) {
        const categorySet = new Set(categories.map(category => category.id))
        setFilteredCategories(categorySet)
    }

    function onBrandChange(brands) {
        const brandSet = new Set(brands.map(brand => brand.id))
        setFilteredBrands(brandSet)
    }

    function onVisibilityChange(visibilities) {
        const visibilitySet = new Set(visibilities.map(visibility => visibility.bool))
        setFilteredVisibilities(visibilitySet)
    }

    return (
        <>
        <Container>
            <Row>
                <Col>
                    Which filters would you like to apply?
                </Col>
            </Row>
            <Row>
                <Col>
                    Categories:
                </Col>
                <Col>
                    <MultiSelect
                        options = {categories}
                        isObject= {true}
                        onSelect = {onCategoryChange} 
                        onRemove = {onCategoryChange}
                        displayValue = "name"
                        showCheckbox = {true}
                        closeOnSelect = {false}
                    />
                </Col>
            </Row>
            <Row style={{marginTop:'250px'}}>
                <Col>
                    Brands:
                </Col>
                <Col>
                    <MultiSelect
                            options = {brands}
                            isObject= {true}
                            onSelect = {onBrandChange} 
                            onRemove = {onBrandChange}
                            displayValue = "name"
                            showCheckbox = {true}
                            closeOnSelect = {false}
                        />
                </Col>
            </Row>
            <Row style={{marginTop:'250px'}}>
                <Col>
                    Visibility:
                </Col>
                <Col>
                    <MultiSelect
                            options = {[{name:'Not Visible', bool:false}, {name:'Visible', bool:true}]}
                            onSelect = {onVisibilityChange} 
                            onRemove = {onVisibilityChange}
                            displayValue="name"
                            showCheckbox = {true}
                            closeOnSelect = {false}
                        />
                </Col>
            </Row>
            <Row>
                <Link to='/' state={{'filteredBrands': filteredBrands, 'filteredCategories': filteredCategories, 'filteredVisibilities': filteredVisibilities}}>
                    <h2>Back to Products</h2>
                </Link>
            </Row>
        </Container>
        </>
    );
}

export default FilterPage;