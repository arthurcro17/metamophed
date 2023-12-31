import React, {useState, useEffect} from "react";
import Button from 'react-bootstrap/Button';
import { BoxArrowDown, BoxArrowUp, FilterCircle, FilterCircleFill} from 'react-bootstrap-icons'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { Link } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import MultiSelect from 'multiselect-react-dropdown';

function Products() {
    const [products, setProducts] = useState({})
    const [categories, setCategories] = useState({})
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [loadingBrands, setLoadingBrands] = useState(true)
    const [brands, setBrands] = useState({})

    const [filtersApplied, setFiltersApplied] = useState(false)
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false)
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
    const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false)
    const [isBrandFiltered, setIsBrandFiltered] = useState(false)
    const [isCategoryFiltered, setIsCategoryFiltered] = useState(false)
    const [isVisibilityFiltered, setIsVisibilityFiltered] = useState(false)
    const [filteredBrands, setFilteredBrands] = useState(new Set())
    const [filteredCategories, setFilteredCategories] = useState(new Set())
    const [filteredVisibilities, setFilteredVisibilities] = useState(new Array())
    const [filteredProductIDs, setFilteredProductIDs] = useState(new Set())
    const [selectedProductsIDs, setSelectedProductsIDs] = useState(new Set())
    const [templates, setTemplates] = useState([])
    const [selectedTemplateID, setSelectedTemplateID] = useState(-1)
    const [saveMessage, setSaveMessage] = useState('')
    const [saveMessageVariant, setSaveMessageVariant] = useState('')
    const [isStickyTabShown, setIsStickyTabShown] = useState(true)

    /*

    First functions all are called when page first loads, fetching the 
    stores products, categories, brands, and any templates associates with the store.
    
    */

    async function getCategories() {
        const url = `${process.env.REACT_APP_BACKEND}/get_categories/`
        const fetchConfig = {
            credentials: 'include',
        }
        const response = await fetch(url, fetchConfig);
        if (response.ok) {
            const data = await response.json();
            for (const [key, value] of Object.entries(data['categories'])) {
                categories[key] = value
            }
            setCategories({...categories})
        }
        setLoadingCategories(false)
    }

    async function getProducts() {
        const url = `${process.env.REACT_APP_BACKEND}/get_products/`;
        const fetchConfig = {
            credentials: "include",
        }
        const response = await fetch(url, fetchConfig);
        if (response.ok) {
            const data = await response.json();
            var map = {}
            for (const product of data['products']) {
                map[product['id']] = product
            }
            setProducts(map);
        }
        setLoadingProducts(false)
      }

    async function getBrands() {
        const url = `${process.env.REACT_APP_BACKEND}/get_brands/`
        const fetchConfig = {
            credentials: 'include',
        }
        const response = await fetch(url, fetchConfig);
        if (response.ok) {
            const data = await response.json();
            for (const [key, value] of Object.entries(data['brands'])) {
                brands[key] = value
            }
            setBrands({...brands})
        }
        setLoadingBrands(false)
    }

    async function getTemplates() {
        const url = `${process.env.REACT_APP_BACKEND}/product_template/`
        const fetchConfig = {
            credentials: "include",
            method: "GET",
        }
        const response = await fetch(url, fetchConfig)
        if (response.ok) {
            const data = await response.json()
            setTemplates(data['templates'])
        }
    }

    useEffect(() => {
        getProducts()
        getCategories()
        getBrands()
        getTemplates()
    }, []);

    useEffect(() => {
        setFiltersApplied((filteredBrands.size + filteredCategories.size + filteredVisibilities.length > 0))

    }, [filteredBrands, filteredCategories, filteredVisibilities])

    useEffect(() => {
        setSaveMessage('')
        setSaveMessageVariant('')
    }, [selectedProductsIDs, selectedTemplateID])

    if (loadingProducts || loadingCategories || loadingBrands) {
        return <div>Loading...</div>
    }

    if (Object.keys(products).length === 0) {
        return <div>No Products</div>
    }

    /*

    Here are the functions related to the filtering of the products

    */

    function productFilter(product) {
        var newSet = filteredProductIDs
        console.log('PRODUCT ID: ', product.id)
        if (!filtersApplied) {
            setFilteredProductIDs(newSet.add(product.id))
            console.log('Filters Applied')
            return true
        }
        if (filteredVisibilities.length > 0 && !filteredVisibilities.includes(Number(product.is_visible))) {
            newSet.delete(product.id)
            setFilteredProductIDs(newSet)
            console.log('Visibility')
            return false
        }
        if (filteredBrands.size > 0 && !filteredBrands.has(product.brand_id.toString())) {
            newSet.delete(product.id)
            setFilteredProductIDs(newSet)
            console.log('Brand')
            return false
        }
        if (filteredCategories.size > 0) {
            for (const category of product.categories) {
                if (filteredCategories.has(category.toString())) {
                    newSet.add(product.id)
                    setFilteredProductIDs(newSet)
                    console.log('Categories')
                    return true
                }
            }

            return false
        }
        return true
    }

    const toggleBrandDropdown = () => {
        setIsBrandDropdownOpen(!isBrandDropdownOpen)
    }

    const toggleCategoryDropdown = () => {
        setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
    }

    const toggleVisibilityDropdown = () => {
        setIsVisibilityDropdownOpen(!isVisibilityDropdownOpen)
    }

    function onBrandChange(brands) {
        const brandSet = new Set(brands.map(brand => brand.id))
        setFilteredBrands(brandSet)
        setIsBrandFiltered(brandSet.size > 0)
    }

    function onCategoryChange(categories) {
        const categorySet = new Set(categories.map(category => category.id))
        setFilteredCategories(categorySet)
        setIsCategoryFiltered(categorySet.size > 0)
    }

    function onVisibilityChange(visibilities) {
        const visibilityList = visibilities.map(visibility => visibility.id)
        setFilteredVisibilities(visibilityList)
        setIsVisibilityFiltered(visibilityList.length > 0)
    }

    /* 

    Here are the functions for formatting the product info displayed in the table

    */

    function ThumbnailImage(props) {
        for (const image of props.images) {
            if (image['is_thumbnail'] === true) {
                return (
                    <img src= {image['url_thumbnail']} className="thumbnail-class" alt=''/>
                )}}}
 
    function CategoryNames(props) {
        var categoryList = []
        for (const id of props.categoryIDs) {
            categoryList.push(categories[id])
        }
        return categoryList.join(', ')
    }

    function ProductVisibility(props) {
        if (props.visible) {
            return (
                <div style={{ color: 'white', backgroundColor: 'green', textAlign: 'center'}}>
                    Enabled
                </div>
            )}
        else {
            return (
                <div style={{ color: 'white', backgroundColor: 'red', textAlign: 'center'}}>
                    Disabled
                </div>
            )}}

    function MetaKeywords(props) {
        if (typeof(props.product['meta_keywords']) == "string") {
            return ( 
                <div>
                    {props.product['meta_keywords']}
                </div>
            )
        }
        else {
            return (
                <div>
                    {props.product['meta_keywords'].join(", ")}
                </div>   
            )
        }
    }

    function ProductTable(props) {
        return (
        <table className="table-custom">
            <thead>
                <tr>
                    <th>
                        <input className="form-check-class" type="checkbox" onClick={(e) => selectAllProducts()} defaultChecked={selectedProductsIDs.size===filteredProductIDs.size}/>
                    </th>
                    <th>Image</th>
                    <th>Product</th>
                    <th>
                        <div className="table-header-with-button">
                            Brand
                            <button className="dropdown-button" onClick={toggleBrandDropdown}>
                                {isBrandFiltered ? <FilterCircleFill/> : <FilterCircle/>}
                            </button>
                            <div className="dropdown-search">
                                {isBrandDropdownOpen &&
                                        <MultiSelect
                                        options = {Object.keys(brands).map(key => ({'id': key, 'name': brands[key]}))}
                                        isObject= {true}
                                        onSelect = {onBrandChange}
                                        onRemove = {onBrandChange}
                                        displayValue = "name"
                                        showCheckbox = {true}
                                        selectedValues = {Object.entries(brands).filter(([key]) => filteredBrands.has(key)).map(([key, value]) => ({id: key, name: value}))}
                                        closeOnSelect = {false}
                                        className = {'multiselect-class'}
                                    />
                                }
                            </div>
                        </div>
                    </th>
                    <th>
                        <div className="table-header-with-button">
                            Categories
                            <button className="dropdown-button" onClick={toggleCategoryDropdown}>
                                {isCategoryFiltered ? <FilterCircleFill/> : <FilterCircle/>}
                            </button>
                            <div className="dropdown-search">
                                {isCategoryDropdownOpen &&
                                        <MultiSelect
                                        options = {Object.keys(categories).map(key => ({'id': key, 'name': categories[key]}))}
                                        isObject= {true}
                                        onSelect = {onCategoryChange}
                                        onRemove = {onCategoryChange}
                                        displayValue = "name"
                                        showCheckbox = {true}
                                        selectedValues = {Object.entries(categories).filter(([key]) => filteredCategories.has(key)).map(([key, value]) => ({id: key, name: value}))}
                                        closeOnSelect = {false}
                                        className = {'multiselect-class'}
                                    />
                                }
                            </div>
                        </div>
                    </th>
                    <th>Description</th>
                    <th>Page Title</th>
                    <th>Meta Description</th>
                    <th>Meta Keywords</th>
                    <th>Stock</th>
                    <th>
                        <div className="table-header-with-button">
                            Visibility
                            <button className="dropdown-button" onClick={toggleVisibilityDropdown}>
                                {isVisibilityFiltered ? <FilterCircleFill/> : <FilterCircle/>}
                            </button>
                            <div className="dropdown-search">
                                {isVisibilityDropdownOpen &&
                                        <MultiSelect
                                        options = {[{id: 1, name: 'Enabled'}, {id: 0, name: 'Disabled'}]}
                                        isObject= {true}
                                        onSelect = {onVisibilityChange}
                                        onRemove = {onVisibilityChange}
                                        showCheckbox = {true}
                                        selectedValues = {[{id: 1, name: 'Enabled'}, {id: 0, name: 'Disabled'}].filter((item) => filteredVisibilities.includes(item.id))}
                                        closeOnSelect = {false}
                                        displayValue = "name"
                                        className = {'multiselect-class'}
                                    />
                                }
                            </div>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                {Object.values(props.productList).filter(productFilter).map((product) => (
                    <React.Fragment key={product['id']}>
                    <tr>
                        <td >
                            <input className="form-check-class" type="checkbox" id={product['id']} onClick={() => changeSelectedProducts(product['id'])} defaultChecked={selectedProductsIDs.has(product['id'])}/>
                        </td>
                        <td>
                            <ThumbnailImage images = {product['images']}/>
                        </td>
                        <td>
                            {product['name']}
                        </td>
                        <td>
                            {brands[product['brand_id']]}
                        </td>
                        <td>
                            <CategoryNames categoryIDs = {product['categories']}/>
                        </td>
                        <td>
                            <div className="scrollable-content"> 
                                {product['description']}
                            </div>
                        </td>
                        <td>
                            <div className="scrollable-content">
                                {product['page_title']}
                            </div>
                        </td>
                        <td>
                            <div className="scrollable-content">
                                {product['meta_description']}
                            </div>
                        </td>
                        <td>
                            <div className="scrollable-content">
                                <MetaKeywords product = {product} />
                            </div>
                        </td>
                        <td>
                            {product['inventory_level']}
                        </td>
                        <td>
                            <ProductVisibility visible={product['is_visible']}/>
                        </td>
                    </tr>
                    </React.Fragment>
                ))}
            </tbody>
        </table>   
        )}

    /*

    Here are the functions related to selected products to be edited

    */

    function changeSelectedProducts(id) {
        var newSet = selectedProductsIDs
        if (!newSet.delete(id)) {
            newSet.add(id)
        }
        setSelectedProductsIDs(newSet)
    }

    function selectAllProducts() {
        if (selectedProductsIDs.size === filteredProductIDs.size) {
            setSelectedProductsIDs(new Set())
        }
        else {
            setSelectedProductsIDs(filteredProductIDs)
        }
        console.log('filtered: ', filteredProductIDs, 'selected: ', selectedProductsIDs, 'brands', filteredBrands, 'categories', filteredCategories)
    }

/* 

Here are the functions for selecting and applying a template to the products

*/

    function ProductTemplateDropDown() {
        return (
            <Form className="form-custom">
                <Form.Group>
                    <Form.Select value={selectedTemplateID} onChange={(e) => (setSelectedTemplateID(e.target.value))}>
                        <option key={-1} value={-1}>Product Templates</option>
                        {Object.entries(templates).map(([id,template]) => (
                            <option key={id} value={id}>{template['template_name']}</option>
                        ))}
                    </Form.Select>
                </Form.Group>
            </Form>
        )
    }

    function ApplyTemplate() {
        return (
            <>
            <Row>
                <Col>
                    <Button className="btn-custom" variant="success" onClick={()=> {updateProducts()}}>Apply Template</Button>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Alert variant={saveMessageVariant}>{saveMessage}</Alert>
                </Col>
            </Row>
            </>
        )
    }

    const toggleTab = () => {
        setIsStickyTabShown(!isStickyTabShown)
    }

    function StickyTab() {
        return (
            <Container className={`sticky-tab ${isStickyTabShown ? 'shown' : 'hidden'}`}>
                <Row>
                    <Col className="sticky-tab-element" style={{fontSize:'20px', fontWeight:'bold', paddingTop:'10px'}}>
                        <h1>Edit Product Details</h1>
                    </Col>
                </Row>
                <Row>
                    <Col className="sticky-tab-element">
                        <h3>Select template to apply to products</h3>
                    </Col>
                </Row>
                <Row>
                    <Col className="sticky-tab-element">
                        <ProductTemplateDropDown/>
                    </Col>
                </Row>
                <Row>
                    <Col className="sticky-tab-element" style={{paddingBottom:'0'}}>
                        <ApplyTemplate/>
                    </Col>
                </Row>
                <button onClick={toggleTab} className="toggle-button"> 
                    {isStickyTabShown ? <BoxArrowDown/> : <BoxArrowUp/>}
                </button>
            </Container>
        )
    }

    async function updateProducts() {
        if (selectedTemplateID  === -1) {
            setSaveMessageVariant('warning')
            setSaveMessage('Please select a Template to be applied')
            return
        }
        if (selectedProductsIDs.size === 0) {
            setSaveMessageVariant('warning')
            setSaveMessage('Please select some products to be edited')
            return
        }
        const productsToUpdate = Array.from(selectedProductsIDs).map(id => products[id])
        const url = `${process.env.REACT_APP_BACKEND}/update_products/`;
        const fetchConfig = {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "products": productsToUpdate,
                "templateID": selectedTemplateID,
                "brands": brands,
                "categories": categories,
            })
        }
        const response = await fetch(url, fetchConfig)
        if (response.ok) {
            setSaveMessageVariant('success')
            setSaveMessage('Products Successfully Updated')
            getProducts()
        }
    }

    function TemplateEditor() {
        return (
            <div style={{paddingTop:'20px'}}>
                <Link className="btn-custom link-class" to='/productTemplate' state={{products: products, brands: brands, categories: categories, templates: templates}} >
                    Product Templates
                </Link>
            </div>
        )
    }

    return (
        <Container>
            <div className="top-section">
                <Row>
                    <TemplateEditor/>
                    <Col className="title">
                        <h1>MetaMorphed</h1>
                    </Col>
                </Row>
            </div>
            <Row>
                <Col style={{textAlign:'right'}}>
                    <Button className="btn-custom" variant="outline-dark" 
                    onClick={()=> 
                    {setFiltersApplied(false); 
                    setFilteredBrands(new Set()); 
                    setFilteredCategories(new Set()); 
                    setFilteredVisibilities(new Array())
                    setIsBrandFiltered(false)
                    setIsCategoryFiltered(false)
                    setIsVisibilityFiltered(false)}}>
                        Clear Filters
                    </Button>
                </Col>
            </Row>
            <Row>
                <Col>
                    <ProductTable productList = {products}/>
                </Col>
                <StickyTab/>
            </Row>
            
        </Container>
    );
}

export default Products;
