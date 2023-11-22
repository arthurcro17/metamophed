import React, {useState, useEffect} from "react";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { ArrowRightCircleFill, ArrowDownCircle } from 'react-bootstrap-icons'
import no_image from './images/no-image-icon.png'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useLocation, Link } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';

function Products() {
    const [products, setProducts] = useState({})
    const [categories, setCategories] = useState({})
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [loadingBrands, setLoadingBrands] = useState(true)
    const [displayVariants, setDisplayVariants] = useState({})
    const [brands, setBrands] = useState({})
    const location = useLocation({state:{}})
    const [filtersApplied, setFiltersApplied] = useState(false)
    const [filteredBrands, setFilteredBrands] = useState(new Set())
    const [filteredCategories, setFilteredCategories] = useState(new Set())
    const [filteredVisibilities, setFilteredVisibilities] = useState(new Set())
    const [filteredProductIDs, setFilteredProductIDs] = useState(new Set())
    const [selectedProductsIDs, setSelectedProductsIDs] = useState(new Set())
    const [templates, setTemplates] = useState([])
    const [selectedTemplateID, setSelectedTemplateID] = useState(-1)
    const [saveMessage, setSaveMessage] = useState('')
    const [saveMessageVariant, setSaveMessageVariant] = useState('')


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
        if (location['state']) {
            setFilteredBrands(location.state.filteredBrands)
            setFilteredCategories(location.state.filteredCategories)
            setFilteredVisibilities(location.state.filteredVisibilities)
            setFiltersApplied(true)
        }
    }, [location.state])

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

    function ThumbnailImage(props) {
        for (const image of props.images) {
            if (image['is_thumbnail'] === true) {
                return (
                    <img src= {image['url_thumbnail']} alt='' style={{opacity: 0.65, height: '100px', width:'100px'}}/>
                )}}}

    function BrandName(props) {
        return (
            <div>
                {brands[props.brandID]}
            </div>
        )
    }
 
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
                <div style={{ color: 'white', backgroundColor: 'red'}}>
                    Disabled
                </div>
            )}}

    function hasVariants(variants) {
        if (variants.length > 1) {
            return false // Set to True if enabling variants
        }
        return false
    }

    function ProductVariantArrow(props) {
        if (hasVariants(props.variants)) {
            if (!displayVariants[props.id]) {
                return (
                    <Button style= {{backgroundColor: '#D6ECFB', border:'0px', alignItems: 'center'}} onClick={() => changeDisplayVariants(props.id) }>
                        <ArrowRightCircleFill style= {{height: '25px', width: '25px', color: 'A3B9C8'}}/>
                    </Button>
                )}
            else {
                return (
                    <Button style= {{backgroundColor: '#D6ECFB', border:'0px', alignItems: 'center'}} onClick={() => changeDisplayVariants(props.id) }>
                        <ArrowDownCircle style= {{height: '25px', width: '25px', color: 'A3B9C8'}}/>
                    </Button>
                )}}}

    function VariantName(props) {
        var names = []
        for (const option of props.options) {
            names.push(option['label'])
        }
        return names.join(', ')
    }

    function changeDisplayVariants(id) {
        const newDisplayVariants = {}
        newDisplayVariants[id] = !(displayVariants[id] ?? false)
        setDisplayVariants(newDisplayVariants)
        return
    }

    function ProductVariants(props) {
        if (displayVariants[props.id] === true) {
            return (
                <>
                {props.variants.map((variant) => (
                    <tr key = {String(variant['id']) + String(variant['product_id'])} style={{backgroundColor: '#D6ECFB'}}>
                        <td></td>
                        <td>
                            {/* <input className="form-check-input" type="checkbox" id={variant['id']} value="" style={{ height:"26px", width:"26px" }}/> */}
                        </td>
                        <td>
                            <img src= {variant['image_url']} alt="" onError={(e) => (e.target.src = no_image)} style={{opacity: 0.65, height: '100px', width:'100px'}}/>
                        </td>
                        <td>
                            <VariantName options = {variant['option_values']}/>
                        </td>
                        <td></td>
                        <td></td>
                        <td>{variant['inventory_level']}</td>
                        <td></td>
                    </tr>
                ))}
                </>
            )}
        else {
            return
        }}

    function productFilter(product) {
        var newSet = filteredProductIDs
        if (!filtersApplied) {
            setFilteredProductIDs(newSet.add(product.id))
            return true
        }
        if (!filteredVisibilities.has(product.is_visible)) {
            newSet.delete(product.id)
            setFilteredProductIDs(newSet)
            return false
        }
        if (!filteredBrands.has(product.brand_id)) {
            newSet.delete(product.id)
            setFilteredProductIDs(newSet)
            return false
        }
        for (const category of product.categories) {
            if (filteredCategories.has(category)) {
                setFilteredProductIDs(newSet.add(product.id))
                return true
                }
        }
        return false
    }

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
    }

    function MetaKeywords(props) {
        if (typeof(props.product['meta_keywords']) == "string") {
            return ( 
                <div style={{maxHeight:'150px', overflowY:'auto'}}>
                    {props.product['meta_keywords']}
                </div>
            )
        }
        else {
            return (
                <div style={{maxHeight:'150px', overflowY:'auto'}}>
                    {props.product['meta_keywords'].join(", ")}
                </div>   
            )
        }
    }

    function ProductTable(props) {
        return (
        <Table>
            <thead>
                <tr>
                    <th>
                        <input className="form-check-input" type="checkbox" style={{ height:"26px", width:"26px" }} onClick={(e) => selectAllProducts()} defaultChecked={selectedProductsIDs.size===filteredProductIDs.size}/>
                    </th>
                    <th></th>
                    <th>Image</th>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Categories</th>
                    <th>Description</th>
                    <th>Page Title</th>
                    <th>Meta Keywords</th>
                    <th>Meta Description</th>
                    <th>Stock</th>
                    <th>Visibility</th>
                </tr>
            </thead>
            <tbody style={{overflowY:'scroll'}}>
                {Object.values(props.productList).filter(productFilter).map((product) => (
                    <React.Fragment key={product['id']}>
                    <tr style={{backgroundColor: '#D6ECFB', height:'30px', overflow:'scroll'}}>
                        <td>
                            <input className="form-check-input" type="checkbox" id={product['id']} style={{ height:"26px", width:"26px" }} onClick={() => changeSelectedProducts(product['id'])} defaultChecked={selectedProductsIDs.has(product['id'])}/>
                        </td>
                        <td>
                            <ProductVariantArrow variants = {product['variants']} id = {product['id']}/>
                        </td>
                        <td>
                            <ThumbnailImage images = {product['images']}/>
                        </td>
                        <td>{product['name']}</td>
                        <td>
                            <BrandName brandID = {product['brand_id']}/>
                        </td>
                        <td>
                            <CategoryNames categoryIDs = {product['categories']}/>
                        </td>
                        <td>
                            <div style={{maxHeight:'150px', overflowY:'auto'}}>
                                {product['description']}
                            </div>
                        </td>
                        <td>{product['page_title']}</td>
                        <td>
                            <div style={{maxHeight:'150px', overflowY:'auto'}}>
                                {product['meta_description']}
                            </div>
                        </td>
                        <td>
                            <MetaKeywords product = {product} />
                        </td>
                        <td>{product['inventory_level']}</td>
                        <td>
                            <ProductVisibility visible={product['is_visible']}/>
                        </td>
                    </tr>
                    <ProductVariants id = {product['id']} variants = {product['variants']}/>
                    </React.Fragment>
                ))}
            </tbody>
        </Table>   
        )}

    function ProductTemplateLink() {
        return (
            <Link to='/productTemplate' state={{products: products, brands: brands, categories: categories}}>
            <h3>Product Template</h3>
            </Link>
        )
    }

    function ProductTemplateDropDown() {
        return (
            <Form>
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

    async function updateProducts() {
        if (selectedTemplateID  == -1) {
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
    
    
    function ApplyTemplate() {
        return (
            <>
            <Row>
                <Col style={{textAlign: 'right', marginTop:'20px'}}>
                    <Button variant="success" onClick={()=> {updateProducts()}}>Apply Template</Button>
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

    return (
        <Container>
            <Row>
                <Col style= {{textAlign: 'center'}}>
                    <h1>Products</h1>
                </Col>
            </Row>
            <Row>
                <Col>
                    <ProductTemplateLink/>
                </Col>
                <Col style = {{textAlign: 'right'}}>
                    <Link to='/filters' state={{brands: brands, categories: categories}}>
                        <h2>Filters</h2>
                    </Link>
                    <Button variant="outline-dark" onClick={()=> {setFiltersApplied(false); setFilteredBrands(new Set()); setFilteredCategories(new Set()); setFilteredVisibilities(new Set())}}>Clear Filters</Button>
                </Col>
            </Row>
            <Row style={{marginTop: '20px', textAlign:'left'}}>
                <Col className='col-2'>Select a Template to Apply to Products:</Col>
                <Col className='col-5' style={{textAlign:'left'}}>
                    <ProductTemplateDropDown/>
                </Col>
            </Row>
            <ApplyTemplate/>
            <Row>
                <Col>
                    <ProductTable productList = {products}/>
                </Col>
            </Row>
        </Container>
    );
}

export default Products;
